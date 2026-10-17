"""One original-condition compiler shared by playable stories and route guides."""
from expression_dsl import build_condition_expression, character_guard, quote


def compile_condition(node, name_ids, task_ids):
    kind, value = node.get("type"), node.get("value", "")
    if kind == "in_newbie_task":
        if value not in task_ids:
            raise ValueError(f"unknown newbie task: {value}")
        return f"has_flag({quote('newbie_' + value)})"
    if kind in {"in_team", "not_in_team"}:
        expression = "(" + " || ".join(f"in_team({quote(c)})" for c in name_ids.get(value, [value])) + ")"
        return "!" + expression if kind == "not_in_team" else expression
    if kind in {"daode_more_than", "daode_less_than", "have_money", "have_yuanbao"}:
        variable = {"have_money": "silver", "have_yuanbao": "yuanbao"}.get(kind, "morality")
        return f"{variable} {'<' if kind.endswith('less_than') else '>='} {int(value)}"
    if kind == "not_have_item":
        return f"item_count({quote(value)}) == 0"
    if kind == "probability":
        amount = int(value)
        if not 0 <= amount <= 100:
            raise ValueError(f"invalid probability: {value}")
        return f"chance({amount / 100:g})"
    if kind == "rank":
        return f"rank != -1 && rank <= {int(value)}"
    if kind in {"haogan_more_than", "haogan_less_than"}:
        parts = value.split("#")
        character, amount = ("女主", parts[0]) if len(parts) == 1 else parts
        return f"favorability({quote(character)}) {'<' if kind.endswith('less_than') else '>='} {int(amount)}"
    if kind and any(kind == f"{stat}_{op}_than" for stat in ("dingli", "wuxing", "jianfa", "quanzhang", "daofa", "qimen") for op in ("greater", "less")):
        character, amount = value.split("#")
        stat = kind.split("_")[0]
        return character_guard(character, f"character_stat({quote(character)}, {quote(stat)}) {'<' if '_less_' in kind else '>='} {int(amount)}")
    return build_condition_expression(kind, value)
