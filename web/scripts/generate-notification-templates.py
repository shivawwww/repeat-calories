"""
Generates a large, varied bank of push-notification title/body pairs for the
lunch and dinner order-cutoff reminders, and writes them straight into
lib/notificationTemplates.ts as a hardcoded TS array (no DB storage — the app
picks one at random per recipient at send time).

Re-run this any time you want to refresh/expand the bank:
    python scripts/generate-notification-templates.py
"""
import itertools
import random

random.seed(42)  # reproducible output across re-runs unless the pools below change

OUT_PATH = "lib/notificationTemplates.ts"
PER_MEAL_COUNT = 220

# ---------------------------------------------------------------------------
# Building blocks. Each combo = one title opener + one body hook + one body
# urgency line, so N openers x M hooks x K urgency lines gives far more
# distinct combinations than any hand-written list, while every individual
# piece is still a real, deliberately-written phrase (not word-salad).
# ---------------------------------------------------------------------------

LUNCH_TITLES = [
    "🍱 Lunch o'clock", "🍛 Macro check-in", "🥗 Hey, hungry?", "🔥 Lunch cutoff alert",
    "🍽️ Rep. Eat. Repeat.", "⏰ Lunch closing soon", "💪 Protein's calling", "🌿 Fuel up, Coimbatore",
    "🍱 Your meal's waiting", "😋 Lunch time, no excuses", "🥙 Skip the guilt, not the meal",
    "🍚 12PM-you says thanks", "🔔 Last call for lunch", "🍲 Macros o'clock", "🥦 Clean eating, easy ordering",
    "🍱 Don't skip lunch again", "💥 Lunch window closing", "🧡 Rep Eat Repeat time", "🍛 Kitchen's firing up",
    "⏳ Tick tock, lunch stops", "🍜 One tap to lunch", "🥘 Today's plate is ready", "🍽️ Feed the grind",
    "🔥 Cutoff's ticking", "🥗 Real food, real fast", "🍱 Lunch, sorted", "💪 Gains start with lunch",
]

LUNCH_HOOKS = [
    "Balanced meals, real macros, zero effort.",
    "Fresh, protein-packed, delivered across Coimbatore.",
    "Your protein plate is one tap away.",
    "Skip the cooking, keep the gains.",
    "Clean calories, on your schedule.",
    "Macro-balanced lunch, made fresh today.",
    "No prep, no cleanup, just fuel.",
    "The kind of lunch your macros actually want.",
    "Cooked fresh, delivered hot, tracked easy.",
    "Today's menu is ready when you are.",
    "Healthy doesn't have to mean boring.",
    "Your midday reset, delivered.",
    "Consistency beats motivation — order lunch.",
    "Stronger you starts with today's lunch.",
    "Real ingredients, honest macros.",
]

LUNCH_URGENCY = [
    "Lunch orders close at 10 AM — order now.",
    "Cutoff's at 10, don't get left hungry.",
    "Only a few minutes left to lock in lunch.",
    "Order before 10 AM or wait till dinner.",
    "The kitchen stops taking lunch orders at 10 sharp.",
    "Window's closing — get your order in.",
    "10 AM cutoff. Don't miss it.",
    "Last few minutes for today's lunch.",
    "Beat the cutoff, beat the hunger.",
    "Almost cutoff time — grab lunch now.",
]

DINNER_TITLES = [
    "🌙 Dinner's calling", "🍛 Evening macro check-in", "🥘 Wind down with dinner", "🔥 Dinner cutoff alert",
    "🍽️ Rep. Eat. Repeat.", "⏰ Dinner closing soon", "💪 Recovery meal time", "🌿 Fuel tonight, Coimbatore",
    "🍱 Tonight's plate is ready", "😋 Dinner, no excuses", "🥙 End the day right",
    "🍚 Future-you says thanks", "🔔 Last call for dinner", "🍲 Evening macros o'clock", "🥦 Clean dinner, easy ordering",
    "🍱 Don't skip dinner tonight", "💥 Dinner window closing", "🧡 Rep Eat Repeat, evening edition", "🍛 Kitchen's still going",
    "⏳ Tick tock, dinner stops", "🍜 One tap to dinner", "🥘 Today's second plate", "🍽️ Feed tonight's grind",
    "🔥 Evening cutoff ticking", "🥗 Real food, real fast", "🍱 Dinner, sorted", "💪 Recovery starts at dinner",
]

DINNER_HOOKS = [
    "Balanced meals, real macros, zero effort.",
    "Fresh, protein-packed, delivered across Coimbatore.",
    "Your recovery plate is one tap away.",
    "Skip the cooking, keep the gains.",
    "Clean calories, even after a long day.",
    "Macro-balanced dinner, made fresh tonight.",
    "No prep, no cleanup, just fuel.",
    "The kind of dinner your macros actually want.",
    "Cooked fresh, delivered hot, tracked easy.",
    "Tonight's menu is ready when you are.",
    "Healthy doesn't have to mean boring.",
    "Your evening reset, delivered.",
    "Consistency beats motivation — order dinner.",
    "Stronger tomorrow starts with tonight's dinner.",
    "Real ingredients, honest macros.",
]

DINNER_URGENCY = [
    "Dinner orders close at 4 PM — order now.",
    "Cutoff's at 4, don't get left hungry tonight.",
    "Only a few minutes left to lock in dinner.",
    "Order before 4 PM or miss tonight's meal.",
    "The kitchen stops taking dinner orders at 4 sharp.",
    "Window's closing — get tonight's order in.",
    "4 PM cutoff. Don't miss it.",
    "Last few minutes for today's dinner.",
    "Beat the cutoff, beat tonight's hunger.",
    "Almost cutoff time — grab dinner now.",
]


def build_bank(titles, hooks, urgency, count):
    combos = list(itertools.product(titles, hooks, urgency))
    random.shuffle(combos)
    seen = set()
    bank = []
    for title, hook, urg in combos:
        body = f"{hook} {urg}"
        key = (title, body)
        if key in seen:
            continue
        seen.add(key)
        bank.append({"title": title, "body": body})
        if len(bank) >= count:
            break
    return bank


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def render_array(name: str, bank: list[dict]) -> str:
    lines = [f"export const {name}: NotificationTemplate[] = ["]
    for item in bank:
        lines.append(f"  {{ title: '{ts_escape(item['title'])}', body: '{ts_escape(item['body'])}' }},")
    lines.append("]")
    return "\n".join(lines)


def main():
    lunch_bank = build_bank(LUNCH_TITLES, LUNCH_HOOKS, LUNCH_URGENCY, PER_MEAL_COUNT)
    dinner_bank = build_bank(DINNER_TITLES, DINNER_HOOKS, DINNER_URGENCY, PER_MEAL_COUNT)

    header = (
        "// AUTO-GENERATED by scripts/generate-notification-templates.py — do not hand-edit.\n"
        "// Re-run that script to regenerate or expand this bank. Picked from at random per\n"
        "// recipient in the lunch/dinner reminder cron routes — never stored in the DB.\n\n"
        "export interface NotificationTemplate {\n"
        "  title: string\n"
        "  body: string\n"
        "}\n\n"
    )

    footer = (
        "\n\nexport function pickRandomTemplate(bank: NotificationTemplate[]): NotificationTemplate {\n"
        "  return bank[Math.floor(Math.random() * bank.length)]\n"
        "}\n"
    )

    content = header + render_array("LUNCH_TEMPLATES", lunch_bank) + "\n\n" + render_array("DINNER_TEMPLATES", dinner_bank) + footer

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Wrote {len(lunch_bank)} lunch + {len(dinner_bank)} dinner templates to {OUT_PATH}")


if __name__ == "__main__":
    main()
