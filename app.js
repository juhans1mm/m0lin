const counter_seconds_el = document.getElementById("count_seconds");
const counter_minutes_el = document.getElementById("count_minutes");
const counter_hours_el = document.getElementById("count_hours");
const counter_eap_el = document.getElementById("count_eap");
const per_second_el = document.getElementById("per_second");

const button_el = document.getElementById("eapclick");
const upgrade_container_el = document.getElementById("upgrade_container");

function round_to(value, n) {
    return +value.toFixed(n);
}

function fmt_time_as_price(seconds) {
    if (seconds < 60) {
        return `${round_to(seconds, 2)} s`
    } else if (seconds < 3600) {
        return `${round_to(seconds / 60, 2)} min`
    } else if (seconds < 3600 * 27.5) {
        return `${round_to(seconds / 3600, 2)} h`
    } else {
        return `${round_to(seconds / 3600 / 27.5, 2)} EAP`
    }
}

let actual_game_state = {
    counter: 0.0,
    cps: 0.0,
    time: 0.0,
    minutes_per_click: 1.0,
    upgrades: {
        "zoute pinda's": { elem: null, count: 0, price: 10, scaling: 1.2, boost: 1   },
        "kohv":          { elem: null, count: 0, price: 25, scaling: 1.2, boost: 2.5 },
        "energiajook":   { elem: null, count: 0, price: 100, scaling: 1.2, boost: 10 },
        "pitsa":         { elem: null, count: 0, price: 150, scaling: 1.2, boost: 15 },
        "pomodoro":      { elem: null, count: 0, price: 750, scaling: 1.2, boost: 50 },
        "ghostwriter":   { elem: null, count: 0, price: 100000, scaling: 1.2, boost: 1000 },
        "altkäemaks":    { elem: null, count: 0, price: 594000, scaling: 1.2, boost: 10000 },
    },
};

function update_counter_element(state) {
    counter_seconds_el.innerText = round_to(state.counter % 60, 2);
    counter_minutes_el.innerText = round_to(Math.floor(state.counter / 60) % 60, 2);
    counter_hours_el.innerText = round_to(Math.floor(state.counter / 3600) % 27.5, 2);
    counter_eap_el.innerText = round_to(Math.floor(state.counter / 3600 / 27.5), 2);
}

function update_upgrade_visibility(state) {
    for (const name in state.upgrades) {
        const upgrade = state.upgrades[name];
        if (state.counter >= upgrade.price) {
            upgrade.elem.removeAttribute("disabled")
        } else {
            upgrade.elem.setAttribute("disabled", "true")
        }
    }
}

const proxy_handler = {
    set(target, prop, value) {
        target[prop] = value;
        if (prop === "counter") {
            update_counter_element(target);
            update_upgrade_visibility(target);
        }
    }
}

const game_state = new Proxy(actual_game_state, proxy_handler);

button_el.onclick = (_) => {
    game_state.counter += game_state.minutes_per_click;
}

function update_per_second() {
    let base = 0;
    for (const [_, upgrade] of Object.entries(game_state.upgrades)) {
        base += upgrade.count * upgrade.boost;
    }
    game_state.cps = base;
    per_second_el.innerText = fmt_time_as_price(base);
}

function init_upgrades() {
    for (const name in game_state.upgrades) {
        const upgrade = game_state.upgrades[name];
        const upgrade_text = (upgrade) => {
            return `(${upgrade.count}) osta <b>${name}</b>, hind: ${fmt_time_as_price(upgrade.price)}`;
        }

        upgrade.elem = document.createElement("button")
        upgrade.elem.innerHTML = upgrade_text(upgrade);
        upgrade.elem.onclick = (_) => {
            if (game_state.counter < upgrade.price) {
                return;
            }

            game_state.counter -= upgrade.price;
            upgrade.count += 1;
            upgrade.price *= upgrade.scaling;
            upgrade.elem.innerHTML = upgrade_text(upgrade);

            update_per_second();
        }

        upgrade_container_el.appendChild(upgrade.elem);
    }
}

function update(time) {
    const dt = (time - game_state.time) / 1000.0;

    game_state.time = time;
    game_state.counter += game_state.cps * dt;

    window.requestAnimationFrame(update);
}

function try_load_save() {
    let save = localStorage.getItem("eap_clicker_save");
    if (save === null) {
        return;
    }
    console.log(`loading save: ${save}`);
    try {
        let parsed_save = JSON.parse(save);

        actual_game_state.counter = parsed_save.counter;

        for (const name in parsed_save.upgrades) {
            actual_game_state.upgrades[name].count = parsed_save.upgrades[name].count;
            actual_game_state.upgrades[name].price = parsed_save.upgrades[name].price;
        }
        
        update_counter_element(actual_game_state);
    } catch (e) {
        console.log(`failed to load save: ${e}`);
    }
}

try_load_save();
init_upgrades();
update_per_second();

// Tobe lahendus
setInterval(() => localStorage.setItem("eap_clicker_save", JSON.stringify(actual_game_state)), 3000)

// Main loop sisuliselt
window.requestAnimationFrame(update);
