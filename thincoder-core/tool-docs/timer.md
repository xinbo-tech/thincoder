Set a timer before you start analyzing code.
When the timer fires, a system reminder will be injected suggesting you try running code or adding debug logs.
Use this to enforce a thinking budget: you get N seconds to reason, then the timer reminds you to act.
Returns the set confirmation — the reminder fires at the deadline.
Delivery: while a turn is running it lands at the next step boundary; when the session is idle it is delivered on the spot and starts a turn — the idle wake is available on the CLI / VSC / desktop foregrounds and suspension windows (headless is structurally unsupported); other paths keep the step-boundary behavior.
A pending timer survives across runs; at most 8 timers may be pending at once, and further timer calls are rejected until some expire.
