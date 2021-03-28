const refresh = require("libs/refresh")
const fc = require("libs/fc")
const theAislol = require("libs/theAislol")
const statuses = require("libs/statuses")

/*function shardUnit(name, DC, DR, type, build){
    const unit = extend(type, name, {});
    unit.constructor = () => extend(build, {
        
        });
    }
    return unit;
};*/

const voidExplosion = new Effect(65, e => {
    Draw.color(Color.black, Color.black, e.fout());
    Lines.stroke(e.fout() * 6);
    let alpha = 1 - Math.sin(e.fout() * Math.PI + Math.PI/3);
    Draw.alpha(alpha);
    Lines.stroke(e.fout() * 2 + Math.sin(e.fin() * 4 * Math.PI));
    let scaling = -Math.sin(e.fout() * e.fout() * Math.PI + Math.PI/3);
    let fromColor = Color.valueOf("#9c7ae1"), toColor = Color.valueOf("#231841");
    fromColor.a = alpha, toColor.a = alpha;
    Fill.light(e.x, e.y, 15, scaling * e.data[0], fromColor, toColor);
    Lines.circle(e.x, e.y, scaling * e.data[0]);
    Angles.randLenVectors(e.id, e.data[3] , -scaling *  e.data[1] + e.data[2], e.rotation, 360, (x, y) => {
        Draw.color(Color.valueOf("#9c7ae1"), Color.valueOf("#231841"), Math.abs(x/30) * Math.abs(y/30) * e.fout())
        Fill.circle(e.x + x, e.y + y, e.fout() * 1.2 + Math.sin(e.fin() * 4 * Math.PI));
    });
    Angles.randLenVectors(e.id, e.data[3] , -scaling *  e.data[1] + e.data[2], e.rotation, 360, (x, y) => {
        Draw.color(Color.valueOf("#9c7ae1"), Color.valueOf("#231841"), Math.abs(x/30) * Math.abs(y/30) * e.fout())
        Fill.square(e.x + x, e.y + y, e.fout() * 2 + Math.sin(e.fin() * 4 * Math.PI));
    });
});

const voidPop = new Effect(75, e => {
    
    let fromColor = Color.valueOf("#9c7ae1"), toColor = Color.valueOf("#231841")
    fromColor.a = e.data[3] * e.fout() * e.fout(), toColor.a = e.data[3] * e.fout() * e.fout()
    
    Draw.color(fromColor, toColor, e.fout())
    
    Fill.light(e.data[0].x, e.data[0].y, e.data[1], e.data[2], fromColor, toColor);
    Angles.randLenVectors(e.id, 6, e.fin() * e.fin() *  e.data[2] + 2, e.rotation, 360, (x, y) => {
        Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fout() * 5);
    });
});

const voidicExplosionB = extend(BombBulletType, {
    darkSplash(b){
        let rad = b.owner.hitSize + 35;
        Units.nearby(b.x - rad * 4, b.y- rad * 4, rad * 8, rad * 8, cons(u => {
            if(!u.isDead && Mathf.dst(b.x, b.y, u.x, u.y) < b.owner.hitSize + 35 && u.team != b.team){
                u.apply(statuses.blackout, 360);
                u.damageContinuousPierce(b.owner.maxHealth/10);
            }
            else{
                u.damageContinuousPierce(b.owner.maxHealth/85);
            }
        }));
    },
    hit(b){
        this.darkSplash(b);
    },
    despawned(b){
        this.darkSplash(b);
        this.super$despawned(b);
    },
    lifetime: 0,
    despawnEffect: Fx.none,
    status: statuses.blackout
});

const blink = extend(UnitType, "blink", {
    load(){
        this.super$load()
        let blinkImmunities = [StatusEffects.wet, StatusEffects.freezing, StatusEffects.corroded, statuses.windswept, statuses.slushFall, statuses.blackout];
        for (var i in blinkImmunities){
            blink.immunities.add(blinkImmunities[i]);
        }
    },
    init(){
        this.super$init()
    },
    //haha no light goes br
    drawLight(unit){},
    display(unit, table){
        table.table(cons(t => {
            t.left();
            t.add(new Image(this.icon(Cicon.medium))).size(8 * 4).scaling(Scaling.fit);
            t.labelWrap(unit.type.localizedName).left().width(190).padLeft(5);
        })).growX().left();
        table.row();

        table.table(cons(bars => {
            bars.defaults().growX().height(20).pad(4);
            bars.add(new Bar("stat.health", Pal.health, () => unit.health/unit.maxHealth))
            bars.row();
            
            bars.add(new Bar(unit.vstring(), Tmp.c2.set(Color.valueOf("#231841")).lerp(Color.valueOf("#9c7ae1"), unit.shieldChargef()), () =>unit.shieldChargef()));
            bars.row();
            
            unit.abilities.forEach(e => {
                ability.displayBars(unit, bars);
            });
            bars.row();
            
        })).growX();

        if(unit.controller instanceof LogicAI){
            table.row();
            table.add(Blocks.microProcessor.emoji() + " " + Core.bundle.get("units.processorcontrol")).growX().wrap().left();
            table.row();
            table.label(() => Iconc.settings + " " + unit.flag + "").color(Color.lightGray).growX().wrap().left();
        }
        
        table.row();
    }
});
blink.constructor = () => extend(MechUnit, {
    damaged(){
        return this.health != this.maxHealth || this.vShield != this.sLimit
    },
    heal(number){
        if(number != null){
            if(this.health >= this.maxHealth){
                if(this.vRecharge <= 0.8 && this.sBroken) this.vRecharge += 0.003;
                else if(this.vShield < this.sLimit) this.vShield = Mathf.clamp(number/this.maxHealth + this.vShield, 0, this.sLimit)
            }
            else{
            this.health += number;
            this.clampHealth();
            }
        }
        else{
            this.health = this.maxHealth;
        }
    },
    collision(b){
        if(b != null && b.type.healPercent > 0) 
        {
            this.hitShield(0.05);
            print("yse :D");
        }
        else print(b.type);
    },
    hitShield(number){
        if(this.vShield >= 1){
            this.DR = 1.1;
            this.vShield--;
            this.eAlpha = 1;
                if(this.vShield < 1 && !this.sBroken){
                    this.sBroken = true;
                    this.vRecharge = 0;
                    voidPop.at(this.x, this.y, 0, [this, 5, this.hitSize + 3, this.eAlpha]);
                }
                else this.vRecharge += 0.01;
        }
        else{
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.005);
            this.vShield = 0;
        }
    },
    shieldAlphaf(number){
        if(number != null) this.eAlpha = number
        else return this.eAlpha;
    },
    shieldCharge(number){
        return this.vShield
    },
    shieldChargef(){
        return this.vShield/this.sLimit;
    },
    vstring(){
        if(this.sBroken === true) return "Shield Shattered"
        else return "Void Shield Charge"
    },
    damage(number){
        if(number > 0){
            this.hitShield(1);
            if(number < this.type.health * 12.5 || number > this.type.health * 50) number = number * (1 - this.DR);
            else number = number * (1 - this.DR * 0.5);
            this.super$damage(number);
        }
        else this.shieldAlphaf(1);
        if(number <= 0) this.hitTime = 1;
    },
    apply(status, time){
        if(time == undefined) time = 1
        if(status != StatusEffects.none && status != null && !this.isImmune(status)){
            if(this.weaknesses.includes(status)){
                time *= 1.25;
                this.super$apply(status, time);
            }
            else if(status.damage <= 0) this.super$apply(status, time);
            else if(status.permanent == true) this.heal(Math.abs(status.damage) * 60);
            else if((this.DR <= 0.75 && this.vShield <= 1) && status.damage > 0) this.super$apply(status, time);
        }
    },
    update(){
        this.super$update();
        if(Mathf.chance(Time.delta)){
            if(this.maxHealth != this.type.health){
                this.DR = Mathf.clamp(this.DR + 0.1, 0, 1);
                this.maxHealth = this.type.health
            }
            this.healFract(this.HPS/6000);
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.01);
            if(!this.sBroken) this.vShield = Mathf.slerpDelta(this.vShield, this.sLimit, 0.001);
            this.eAlpha = Mathf.slerpDelta(this.eAlpha, 0, 0.01);
            if(this.vRecharge < 1 && this.sBroken) this.vRecharge += 0.003;
            else if(this.sBroken) this.sBroken = false;
            this.dCol1.a = this.vShield/2.15 * this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1), this.dCol2.a = this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1);
        }
    },
    draw(){
        this.super$draw();
        if(this.eAlpha > 0) Fill.light(this.x, this.y, 5, this.hitSize * 1.25, this.dCol1, this.dCol2);
        Draw.color(Color.valueOf("#9c7ae1"),Color.valueOf("#231841"), Mathf.clamp(this.vShield, 0, 1));
        Draw.alpha(this.vShield);
        Lines.circle(this.x, this.y, this.hitSize + 3);
    },
    killed(){
        this.super$killed();
        voidExplosion.at(this.x, this.y, this.rotation, [this.hitSize * 4, 3, 5, 4]);
        voidicExplosionB.create(this, this.team, this.x, this.y, this.rotation, 0, 0);
    },
    classId: () => blink.classId,
    dCol1: Color.valueOf("#9c7ae1"),
    dCol2: Color.valueOf("#231841"),
    eAlpha: 0,
    vShield: 1,
    sLimit: 1.5,
    DR: 0,
    HPS: 0.2,
    sRecharge: 1,
    sBroken: false,
    weaknesses: [StatusEffects.burning, StatusEffects.melting, statuses.groveCurse, statuses.seeded]
});
//dCol1 & 2 are the colors used for the shield and effect
//eAlpha is the effect alpha of the effects and unit's void shield
//vSheild is the amount of charge is stored in the unit to activate the void shield
//sLimit is how many shields the unit can store. If below 1, unit can't store void shields
//DR is the percentage of damage the unit negates. Starts at 0, and raises when the shield is activated.
//HPS is the amount of health the unit regenerates per second
//sBroken and sRecharge are variables used in the breaking and recovery of the shield
//weaknesses are status effects which get applied for 1.25 times longer
refresh(blink);

//I should make a lib... -_-
const nescience = extend(UnitType, "nescience", {
    load(){
        this.super$load()
        let nescienceImmunities = [StatusEffects.wet, StatusEffects.freezing, StatusEffects.corroded, StatusEffects.sapped, statuses.windswept, statuses.slushFall, statuses.blackout];
        for (var i in nescienceImmunities){
            nescience.immunities.add(nescienceImmunities[i]);
        }
    },
    drawLight(unit){},
    display(unit, table){
        table.table(cons(t => {
            t.left();
            t.add(new Image(this.icon(Cicon.medium))).size(8 * 4).scaling(Scaling.fit);
            t.labelWrap(unit.localizedName).left().width(190).padLeft(5);
        })).growX().left();
        table.row();

        table.table(cons(bars => {
            bars.defaults().growX().height(20).pad(4);
            bars.add(new Bar("stat.health", Pal.health, () => unit.health/unit.maxHealth))
            bars.row();
            
            bars.add(new Bar(unit.vstring(), Tmp.c2.set(Color.valueOf("#231841")).lerp(Color.valueOf("#9c7ae1"), unit.shieldChargef()), () =>unit.shieldChargef()));
            bars.row();
            
            unit.abilities.forEach(e => {
                ability.displayBars(unit, bars);
            });
            bars.row();
            
        })).growX();

        if(unit.controller instanceof LogicAI){
            table.row();
            table.add(Blocks.microProcessor.emoji() + " " + Core.bundle.get("units.processorcontrol")).growX().wrap().left();
            table.row();
            table.label(() => Iconc.settings + " " + unit.flag + "").color(Color.lightGray).growX().wrap().left();
        }
        
        table.row();
    }
});
nescience.constructor = () => extend(MechUnit, {
    damaged(){
        return this.health != this.maxHealth || this.vShield != this.sLimit
    },
    heal(number){
        if(number != null){
            if(this.health >= this.maxHealth){
                if(this.vRecharge <= 0.8 && this.sBroken) this.vRecharge += 0.003;
                else if(this.vShield < this.sLimit) this.vShield = Mathf.clamp(number/this.maxHealth + this.vShield, 0, this.sLimit)
            }
            else{
            this.health += number;
            this.clampHealth();
            }
        }
        else{
            this.health = this.maxHealth;
        }
    },
    collision(b){
        if(b != null && b.type.healPercent > 0) 
        {
            this.hitShield(0.05);
        }
        else print(b.type);
    },
    hitShield(number){
        if(this.vShield >= 1){
            this.DR = 1.1;
            this.vShield--;
            this.eAlpha = 1;
                if(this.vShield < 1 && !this.sBroken){
                    this.sBroken = true;
                    this.vRecharge = 0;
                    voidPop.at(this.x, this.y, 0, [this, 5, this.hitSize + 3, this.eAlpha]);
                }
                else this.vRecharge += 0.01;
        }
        else{
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.005);
            this.vShield = 0;
        }
    },
    shieldAlphaf(number){
        if(number != null) this.eAlpha = number
        else return this.eAlpha;
    },
    shieldCharge(number){
        return this.vShield
    },
    shieldChargef(){
        return this.vShield/this.sLimit;
    },
    vstring(){
        if(this.sBroken === true) return "Shield Shattered"
        else return "Void Shield Charge"
    },
    damage(number){
        if(number > 0){
            this.hitShield(1);
            if(number < this.type.health * 12.5 || number > this.type.health * 50) number = number * (1 - this.DR);
            else number = number * (1 - this.DR * 0.5);
            this.super$damage(number);
        }
        else this.shieldAlphaf(1);
        if(number <= 0) this.hitTime = 1;
    },
    apply(status, time){
        if(time == undefined) time = 1
        if(status != StatusEffects.none && status != null && !this.isImmune(status)){
            if(this.weaknesses.includes(status)){
                time *= 1.25;
                this.super$apply(status, time);
            }
            else if(status.damage <= 0) this.super$apply(status, time);
            else if(status.permanent == true) this.heal(Math.abs(status.damage) * 60);
            else if((this.DR <= 0.75 && this.vShield <= 1) && status.damage > 0) this.super$apply(status, time);
        }
    },
    update(){
        this.super$update();
        if(Mathf.chance(Time.delta)){
            if(this.maxHealth != this.type.health){
                this.DR = Mathf.clamp(this.DR + 0.1, 0, 1);
                this.maxHealth = this.type.health
            }
            this.healFract(this.HPS/6000);
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.01);
            if(!this.sBroken) this.vShield = Mathf.slerpDelta(this.vShield, this.sLimit, 0.001);
            this.eAlpha = Mathf.slerpDelta(this.eAlpha, 0, 0.01);
            if(this.vRecharge < 1 && this.sBroken) this.vRecharge += 0.003;
            else if(this.sBroken) this.sBroken = false;
            this.dCol1.a = this.vShield/2.15 * this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1), this.dCol2.a = this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1);
        }
    },
    draw(){
        this.super$draw();
        if(this.eAlpha > 0) Fill.light(this.x, this.y, 5, this.hitSize * 1.25, this.dCol1, this.dCol2);
        Draw.color(Color.valueOf("#9c7ae1"),Color.valueOf("#231841"), Mathf.clamp(this.vShield, 0, 1));
        Draw.alpha(this.vShield);
        Lines.circle(this.x, this.y, this.hitSize + 3);
    },
    killed(){
        this.super$killed();
        voidExplosion.at(this.x, this.y, this.rotation, [this.hitSize * 4, 3, 5, 4]);
        voidicExplosionB.create(this, this.team, this.x, this.y, this.rotation, 0, 0);
    },
    classId: () => nescience.classId,
    dCol1: Color.valueOf("#9c7ae1"),
    dCol2: Color.valueOf("#231841"),
    eAlpha: 0,
    vShield: 2,
    sLimit: 2.75,
    DR: 0,
    HPS: 0.35,
    sRecharge: 1,
    sBroken: false,
    weaknesses: [StatusEffects.burning, StatusEffects.melting, statuses.groveCurse, statuses.seeded, statuses.hellfire, statuses.sporefire]
});

refresh(nescience)

//Yep i'll either do these in java or make a flipping lib
const deluge = extend(UnitType, "deluge", {
    load(){
        this.super$load()
        let delugeImmunities = [StatusEffects.wet, StatusEffects.freezing, StatusEffects.corroded, StatusEffects.sapped, statuses.windswept, statuses.slushFall, statuses.blackout];
        for (var i in delugeImmunities){
            deluge.immunities.add(delugeImmunities[i]);
        }
    },
    drawLight(unit){},
    display(unit, table){
        table.table(cons(t => {
            t.left();
            t.add(new Image(this.icon(Cicon.medium))).size(8 * 4).scaling(Scaling.fit);
            t.labelWrap(unit.localizedName).left().width(190).padLeft(5);
        })).growX().left();
        table.row();

        table.table(cons(bars => {
            bars.defaults().growX().height(20).pad(4);
            bars.add(new Bar("stat.health", Pal.health, () => unit.health/unit.maxHealth))
            bars.row();
            
            bars.add(new Bar(unit.vstring(), Tmp.c2.set(Color.valueOf("#231841")).lerp(Color.valueOf("#9c7ae1"), unit.shieldChargef()), () =>unit.shieldChargef()));
            bars.row();
            
            unit.abilities.forEach(e => {
                ability.displayBars(unit, bars);
            });
            bars.row();
            
        })).growX();

        if(unit.controller instanceof LogicAI){
            table.row();
            table.add(Blocks.microProcessor.emoji() + " " + Core.bundle.get("units.processorcontrol")).growX().wrap().left();
            table.row();
            table.label(() => Iconc.settings + " " + unit.flag + "").color(Color.lightGray).growX().wrap().left();
        }
        
        table.row();
    }
});

deluge.constructor = () => extend(MechUnit, {
    damaged(){
        return this.health != this.maxHealth || this.vShield != this.sLimit
    },
    heal(number){
        if(number != null){
            if(this.health >= this.maxHealth){
                if(this.vRecharge <= 0.8 && this.sBroken) this.vRecharge += 0.003;
                else if(this.vShield < this.sLimit) this.vShield = Mathf.clamp(number/this.maxHealth + this.vShield, 0, this.sLimit)
            }
            else{
            this.health += number;
            this.clampHealth();
            }
        }
        else{
            this.health = this.maxHealth;
        }
    },
    collision(b){
        if(b != null && b.type.healPercent > 0) 
        {
            this.hitShield(0.05);
        }
        else print(b.type);
    },
    hitShield(number){
        if(this.vShield >= 1){
            this.DR = 1.1;
            this.vShield--;
            this.eAlpha = 1;
                if(this.vShield < 1 && !this.sBroken){
                    this.sBroken = true;
                    this.vRecharge = 0;
                    voidPop.at(this.x, this.y, 0, [this, 5, this.hitSize + 3, this.eAlpha]);
                }
                else this.vRecharge += 0.01;
        }
        else{
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.005);
            this.vShield = 0;
        }
    },
    shieldAlphaf(number){
        if(number != null) this.eAlpha = number
        else return this.eAlpha;
    },
    shieldCharge(number){
        return this.vShield
    },
    shieldChargef(){
        return this.vShield/this.sLimit;
    },
    vstring(){
        if(this.sBroken === true) return "Shield Shattered"
        else return "Void Shield Charge"
    },
    damage(number){
        if(number > 0){
            this.hitShield(1);
            if(number < this.type.health * 12.5 || number > this.type.health * 50) number = number * (1 - this.DR);
            else number = number * (1 - this.DR * 0.5);
            this.super$damage(number);
        }
        else this.shieldAlphaf(1);
        if(number <= 0) this.hitTime = 1;
    },
    apply(status, time){
        if(time == undefined) time = 1
        if(status != StatusEffects.none && status != null && !this.isImmune(status)){
            if(this.weaknesses.includes(status)){
                time *= 1.25;
                this.super$apply(status, time);
            }
            else if(status.damage <= 0) this.super$apply(status, time);
            else if(status.permanent == true) this.heal(Math.abs(status.damage) * 60);
            else if((this.DR <= 0.75 && this.vShield <= 1) && status.damage > 0) this.super$apply(status, time);
        }
    },
    update(){
        this.super$update();
        if(Mathf.chance(Time.delta)){
            if(this.maxHealth != this.type.health){
                this.DR = Mathf.clamp(this.DR + 0.1, 0, 1);
                this.maxHealth = this.type.health
            }
            this.healFract(this.HPS/6000);
            this.DR = Mathf.slerpDelta(this.DR, 0, 0.01);
            if(!this.sBroken) this.vShield = Mathf.slerpDelta(this.vShield, this.sLimit, 0.001);
            this.eAlpha = Mathf.slerpDelta(this.eAlpha, 0, 0.01);
            if(this.vRecharge < 1 && this.sBroken) this.vRecharge += 0.003;
            else if(this.sBroken) this.sBroken = false;
            this.dCol1.a = this.vShield/2.15 * this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1), this.dCol2.a = this.eAlpha *  Mathf.clamp(Math.round(this.vShield), 0, 1);
        }
    },
    draw(){
        this.super$draw();
        if(this.eAlpha > 0) Fill.light(this.x, this.y, 5, this.hitSize * 1.25, this.dCol1, this.dCol2);
        Draw.color(Color.valueOf("#9c7ae1"),Color.valueOf("#231841"), Mathf.clamp(this.vShield, 0, 1));
        Draw.alpha(this.vShield);
        Lines.circle(this.x, this.y, this.hitSize + 3);
    },
    killed(){
        this.super$killed();
        voidExplosion.at(this.x, this.y, this.rotation, [this.hitSize * 4, 3, 5, 4]);
        voidicExplosionB.create(this, this.team, this.x, this.y, this.rotation, 0, 0);
    },
    classId: () => deluge.classId,
    dCol1: Color.valueOf("#9c7ae1"),
    dCol2: Color.valueOf("#231841"),
    eAlpha: 0,
    vShield: 3,
    sLimit: 4.25,
    DR: 0.8,
    HPS: 0.35,
    sRecharge: 1,
    sBroken: false,
    weaknesses: [StatusEffects.burning, StatusEffects.melting, statuses.groveCurse, statuses.seeded, statuses.hellfire, statuses.sporefire, statuses.slushFall, statuses.prismium]
});
refresh(deluge);

Events.on(ClientLoadEvent, b  => {
    blink.weapons.get(0).bullet.status = statuses.blackout;
    blink.weapons.get(1).bullet.status = statuses.blackout;
    nescience.weapons.get(0).bullet.status = statuses.blackout;
    nescience.weapons.get(1).bullet.status = statuses.blackout;
    deluge.weapons.get(4).bullet.status = statuses.blackout;
    deluge.weapons.get(5).bullet.status = statuses.blackout;
});