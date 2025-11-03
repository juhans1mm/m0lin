const counter_seconds_el = document.getElementById("count_seconds");
const counter_minutes_el = document.getElementById("count_minutes");
const counter_hours_el = document.getElementById("count_hours");
const counter_eap_el = document.getElementById("count_eap");

const button_el = document.getElementById("eapclick");
const upgrade_container_el = document.getElementById("upgrade_container");

const actual_game_state = {
    counter: 0.0,
    time: 0.0,
    minutes_per_click: 1.0,
    upgrades: {
        "zoute pinda's": { elem: null, count: 0, price: 10, scaling: 1.2, boost: 1   },
        "kohv":          { elem: null, count: 0, price: 25, scaling: 1.2, boost: 2.5 },
    },
};

function update_counter_element(value) {
    const make_nice = (value) => {
        return +value.toFixed(2);
    };
    counter_seconds_el.innerText = make_nice(value);
    counter_minutes_el.innerText = make_nice(value / 60.0);
    counter_hours_el.innerText = make_nice(value / 3600.0);
    counter_eap_el.innerText = make_nice(value / 3600.0 / 27.5);
}

const proxy_handler = {
    set(target, prop, value) {
        if (prop === "counter") {
            update_counter_element(value)
            for (const name in target.upgrades) {
                const upgrade = target.upgrades[name];
                if (target.counter >= upgrade.price) {
                    upgrade.elem.removeAttribute("disabled")
                } else {
                    upgrade.elem.setAttribute("disabled", "true")
                }
            }
        }
        target[prop] = value;
    }
}

const game_state = new Proxy(actual_game_state, proxy_handler);

button_el.onclick = (_) => {
    game_state.counter += game_state.minutes_per_click;
}

// Generate upgrade ui
function init_upgrades() {
    for (const name in game_state.upgrades) {
        const upgrade = game_state.upgrades[name];
        const upgrade_text = (upgrade) => {
            return `(${upgrade.count}) osta <b>${name}</b>, hind: ${+upgrade.price.toFixed(2)}`;
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
        }

        upgrade_container_el.appendChild(upgrade.elem);
    }
}

function calculate_auto_cps() {
    let base = 0;
    for (const [_, upgrade] of Object.entries(game_state.upgrades)) {
        base += upgrade.count * upgrade.boost;
    }
    return base;
}

function update(time) {
    const dt = (time - game_state.time) / 1000.0;

    game_state.time = time;
    game_state.counter += calculate_auto_cps() * dt;

    window.requestAnimationFrame(update);
}

init_upgrades();
window.requestAnimationFrame(update);
