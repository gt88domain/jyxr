using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using System.Text.Json.Nodes;
using Game.Application;
using Game.Expressions;

namespace Game.Web.Runtime;

internal sealed partial class BrowserRuntimeSession
{
    private Dictionary<string, ParsedExpression?> _companionConditions = [];

    private Dictionary<string, ParsedExpression?> ParseCompanionConditions(JsonObject pack)
    {
        var result = new Dictionary<string, ParsedExpression?>(StringComparer.Ordinal);
        foreach (var node in pack["companionConditions"]?.AsArray() ?? [])
        {
            var id = node!["id"]!.GetValue<string>();
            var expression = new ExpressionParser().ParseExpression(node["expression"]!.GetValue<string>());
            if (string.IsNullOrWhiteSpace(id) || !result.TryAdd(id, HasChance(expression.Root) ? null : expression))
                throw new InvalidOperationException("伙伴条件编号为空或重复。");
        }
        return result;
    }

    // Inspect the AST rather than trusting a metadata flag. Even a nested
    // probability must never draw random numbers when a guide is opened.
    private bool HasChance(ExpressionSyntax node) => node switch
    {
        CallExpressionSyntax call => call.Name == "chance" || call.Arguments.Any(HasChance),
        UnaryExpressionSyntax unary => HasChance(unary.Operand),
        BinaryExpressionSyntax binary => HasChance(binary.Left) || HasChance(binary.Right),
        ConditionalExpressionSyntax conditional => HasChance(conditional.Condition) || HasChance(conditional.WhenTrue) || HasChance(conditional.WhenFalse),
        ListExpressionSyntax list => list.Items.Any(HasChance),
        _ => false
    };

    public string InspectCompanionConditions()
    {
        var values = new Dictionary<string, bool?>(StringComparer.Ordinal);
        var environment = _session is null ? null : new GameExpressionEnvironment(_session).Create();
        var evaluator = new ExpressionEvaluator();
        foreach (var (id, expression) in _companionConditions)
        {
            bool? value = null;
            if (environment is not null && expression is not null)
            {
                try { value = evaluator.EvaluateBoolean(expression, environment, "companion guide"); }
                catch (Exception error) when (error is InvalidOperationException or ExpressionException) { /* A contextual condition is unknown outside its original story. */ }
            }
            values[id] = value;
        }
        return JsonSerializer.Serialize(values, Json);
    }
}
