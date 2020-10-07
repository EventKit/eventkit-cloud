

// Simple function to conglomerate the boilerplate involved with rendering a component only if a condition is met.
// returns the result of the render function, otherwise null.
// can be especially useful inside JSX to avoid code like
// { A && BB && C || D && (<div></div>) }
// this becomes
// {renderIf(() => (<div></div>), A && BB && C || D &&)}
// The latter clearly separates the conditional and the rendering function.
export function renderIf(renderer: (() => any ) | any, conditional: boolean) {
    if (!conditional) {
        return null;
    }
    // Renderer can be a function returning JSX, or simply a literal JSX object.
    // It may be more performant to pass it as a callback function. Worth testing if this is a meaningful difference.
    return (renderer instanceof Function) ? renderer() : renderer;
}
