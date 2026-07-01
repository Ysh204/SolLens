import { EXPRESSION_GROUPS } from "../lib/expressions";

interface ExpressionExamplesProps {
  onSelect: (expr: string) => void;
  disabled?: boolean;
}

export function ExpressionExamples({ onSelect, disabled }: ExpressionExamplesProps) {
  return (
    <div className="expression-examples">
      <p className="expression-examples-hint">
        Click an example to fill the command line — edit values, then Run.
      </p>
      {EXPRESSION_GROUPS.map((group) => (
        <div key={group.label} className="example-row">
          <span className="row-label">{group.label}</span>
          <div className="example-buttons">
            {group.examples.map((ex) => (
              <button
                key={ex.expr}
                type="button"
                className={`example-btn ${group.label === "Errors" ? "error-type" : ""}`}
                disabled={disabled}
                onClick={() => onSelect(ex.expr)}
                title={ex.expr}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
