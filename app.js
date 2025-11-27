const counter_seconds_el = document.getElementById("count_seconds");
const counter_minutes_el = document.getElementById("count_minutes");
const counter_hours_el = document.getElementById("count_hours");
const counter_eap_el = document.getElementById("count_eap");
const per_second_el = document.getElementById("per_second");
const particle_container_el = document.getElementById("particle_container");

const button_el = document.getElementById("eapclick");

const auto_upgrade_container_el = document.getElementById("upgrade_container");
const manual_upgrade_container_el = document.getElementById("manual_upgrade_container");

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
    time: 0.0,
    cps: 0.0,
    spc: 1.0,
    upgrades: {
        // automaatne
        "zoute pinda's": { elem: null, for_click: false, count: 0, price: 10, scaling: 1.2, boost: 1   },
        "kohv":          { elem: null, for_click: false, count: 0, price: 25, scaling: 1.2, boost: 2.5 },
        "energiajook":   { elem: null, for_click: false, count: 0, price: 100, scaling: 1.2, boost: 10 },
        "pitsa":         { elem: null, for_click: false, count: 0, price: 150, scaling: 1.2, boost: 65 },
        "pomodoro":      { elem: null, for_click: false, count: 0, price: 750, scaling: 1.2, boost: 150 },
        "Y":             { elem: null, for_click: false, count: 0, price: 750, scaling: 1.2, boost: 500 },
        "ghostwriter":   { elem: null, for_click: false, count: 0, price: 100000, scaling: 1.2, boost: 1000 },
        "altkäemaks":    { elem: null, for_click: false, count: 0, price: 594000, scaling: 1.2, boost: 10000 },
        // Käsitsi kasutuseks
        "A": { elem: null, for_click: true, count: 0, price: 5, scaling: 1.2, boost: 3 },
        "B": { elem: null, for_click: true, count: 0, price: 15, scaling: 1.2, boost: 10 },
        "X": { elem: null, for_click: true, count: 0, price: 75, scaling: 1.4, boost: 75 },
        "C": { elem: null, for_click: true, count: 0, price: 75, scaling: 1.4, boost: 250 },
        "D": { elem: null, for_click: true, count: 0, price: 200, scaling: 1.4, boost: 500 },
        "E": { elem: null, for_click: true, count: 0, price: 1000, scaling: 1.4, boost: 1000 },
        "F": { elem: null, for_click: true, count: 0, price: 220000, scaling: 1.4, boost: 5000 },
        "G": { elem: null, for_click: true, count: 0, price: 1000000, scaling: 1.4, boost: 100000 },
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

// https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
function pick_random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Manuaalne nupp
button_el.onclick = (e) => {
    game_state.counter += game_state.spc;

    let floater = document.createElement("div");
    floater.innerText = "+" + fmt_time_as_price(game_state.spc);
    floater.className = "particle";
    floater.style.left = e.clientX + "px";
    floater.style.top = e.clientY + "px";
    floater.style["animation-name"] = pick_random([
        "particle-motion-a",
        "particle-motion-b",
        "particle-motion-c",
        "particle-motion-d"
    ])
    floater.addEventListener("animationend", () => particle_container_el.removeChild(floater));

    particle_container_el.appendChild(floater);
}

function update_per_second() {
    let base_auto = 0;
    let base_manual = 0;
    for (const [_, upgrade] of Object.entries(game_state.upgrades)) {
        if (upgrade.for_click) {
            base_manual += upgrade.count * upgrade.boost;
        } else {
            base_auto += upgrade.count * upgrade.boost;
        }
    }
    game_state.cps = base_auto;
    game_state.spc = base_manual;
    per_second_el.innerText = fmt_time_as_price(base_auto);
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

        if (upgrade.for_click) {
            manual_upgrade_container_el.appendChild(upgrade.elem);
        } else {
            auto_upgrade_container_el.appendChild(upgrade.elem);
        }
    }
}

function update(time) {
    const dt = (time - game_state.time) / 1000.0;

    game_state.time = time;
    game_state.counter += game_state.cps * dt;

    // Failsafe, vältimaks softlocki
    if (actual_game_state.spc <= 1) {
        actual_game_state.spc = 1;
    }

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
