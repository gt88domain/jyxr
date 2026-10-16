"""Compare configured round/trial gifts with the independent pinned C# source."""
import json
import re
from pathlib import Path

repo = Path(__file__).resolve().parents[3]
source = (repo / 'jyx-legacy-dll/JyGame/RollRoleUI.cs').read_text()
source = source.split('public void MakeZhoumuAndShilianBonus()', 1)[1].split('private void JumpSelectCallback', 1)[0]
profile = json.loads((repo / 'src/Game.Web/public/data/content-package.json').read_text())['browser']['creation']
for key, start, stop in [('2', 'case 2:', 'case 3:'), ('3', 'case 3:', 'default:'), ('later', 'default:', 'string[] array')]:
    block = source.split(start, 1)[1].split(stop, 1)[0]
    actual = [re.findall(r'\b' + name + r'\.Add\("([^"]+)"\)', block) for name in ['list', 'list2']]
    assert actual == profile['roundItems'][key], (key, actual)
for tier in profile['trialItems']:
    minimum = tier['minimum']
    pattern = r'(?:if|else if)\s*\(num >= ' + str(minimum) + r'(?: && num < \d+)?\)\s*\{([^{}]+)\}'
    block = re.search(pattern, source)
    assert block is not None, minimum
    actual = re.findall(r'makeItems\.Add\(Item.GetItem\("([^"]+)"\)\)', block[1])
    assert actual == tier['items'], (minimum, actual)
print('PASS all three original round reward pools and six trial thresholds match pinned RollRoleUI.cs')
