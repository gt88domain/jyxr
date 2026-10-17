"""Browser-native presentations keyed by original animation IDs.

These are modern vector effects, not a claim to recovered Unity particles.
All timing and style are presentation data and never modify combat rules.
"""


def apply_battle_presentation(package):
    styles = [
        (("fire", "huo"), "flame", 0xF3A45B),
        (("jian", "dao", "zhan"), "slash", 0xD8EAF3),
        (("quan", "zhang"), "strike", 0xEBC67E),
        (("long", "feng"), "vortex", 0xA4D8CF),
        (("flower", "hua"), "petal", 0xE1A9C8),
        (("taiji", "yuan", "guanghuan"), "ring", 0xAFDBEB),
        (("xue", "baozha"), "burst", 0xE4AC8E),
    ]
    animations = {}
    for collection in ("externalSkills", "legendSkills", "specialSkills"):
        for skill in package[collection]:
            animation = skill.get("animation")
            if not animation: continue
            style, color = "orb", 0xBCD8F1
            for tokens, candidate, tint in styles:
                if any(token in animation.lower() for token in tokens):
                    style, color = candidate, tint; break
            animations[animation] = {"style": style, "color": color, "duration": 520}
    package["browser"]["combatEffects"] = {"default": {"style": "orb", "color": 0xBCD8F1, "duration": 520},
        "animations": animations, "source": "Modern HTML5 vector presentation keyed by original animation IDs; original Unity particle timelines remain unverified."}
