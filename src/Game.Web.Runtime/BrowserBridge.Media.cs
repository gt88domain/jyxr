using System.Text.Json.Nodes;
using Game.Core.Model.Character;

namespace Game.Web.Runtime;

internal sealed partial class BrowserRuntimeSession
{
    private string? ResourceMedia(string? resourceId)
    {
        if (string.IsNullOrEmpty(resourceId)) return null;
        return _pack["media"]?["resources"]?[resourceId]?.GetValue<string>() ??
               _pack["media"]?["paths"]?[resourceId.Replace('\\', '/').ToLowerInvariant()]?.GetValue<string>();
    }

    private JsonNode? CharacterAnimation(CharacterInstance character) =>
        _pack["media"]?["models"]?[character.ResolvedModelId ?? character.Model ?? character.Definition.Model ?? ""];

    private string? CharacterMedia(CharacterInstance character, string group, int team = 1)
    {
        if (group == "portraits" && ResourceMedia(character.Portrait ?? character.Definition.Portrait) is { } portrait) return portrait;
        if (group == "characters" && CharacterAnimation(character)?["poster"]?.GetValue<string>() is { } poster) return poster;
        return CharacterMedia(character.Definition.Id, group, team);
    }

    private string? SpeakerPortrait(string speaker)
    {
        if (_session is not null && (speaker == "主角" || speaker == Hero.Name)) return CharacterMedia(Hero, "portraits");
        if (SpeakerCharacter(speaker) is { } current) return CharacterMedia(current, "portraits");
        if (ResourceMedia("头像." + speaker) is { } portrait) return portrait;
        var character = _content?.Characters.Values.FirstOrDefault(c => c.Name == speaker || c.Id == speaker);
        return character is null ? null : ResourceMedia(character.Portrait);
    }

    private CharacterInstance? SpeakerCharacter(string speaker) => _session?.State.Party.GetActiveMembers()
        .FirstOrDefault(c => c.Id == speaker || c.Name == speaker || c.Definition.Name == speaker)
        ?? _session?.State.Party.Reserves.FirstOrDefault(c => c.Id == speaker);

    private string SpeakerName(string speaker) => SpeakerCharacter(speaker)?.Name ?? speaker;

    private string? ItemMedia(string itemId) => _pack["media"]?["items"]?[itemId]?.GetValue<string>();
}
