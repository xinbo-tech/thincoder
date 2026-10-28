Set a timer before you start analyzing code.
When the timer fires, a system reminder will be injected suggesting you try running code or adding debug logs.
Use this to enforce a thinking budget: you get N seconds to reason, then the timer reminds you to act.

Beyond a one-shot countdown, three schedule forms are available, one per call (`seconds`, `at`, `every` and `daily` are mutually exclusive — passing more than one is a validation error):

`at` takes a local clock time such as "2026-10-13T09:00" and fires once at that moment — a time already past fires immediately.
`every` takes a fixed interval in seconds (minimum 60): the first reminder comes N seconds after setting, then every N seconds, until cancelled.

`daily` takes a local "HH:MM" and repeats every day at that time (a time already past today fires tomorrow), until cancelled.
All times are local to the host.

`cancel` takes the id from the set confirmation and stops that timer; `list` shows every pending timer with its next due time. Repeating timers occupy one pending slot each until cancelled.
Returns the set confirmation — the reminder fires at the deadline.

Delivery: when the session is idle it is delivered on the spot and starts a turn — the idle wake is available on the CLI / VSC / desktop foregrounds and suspension windows (headless is structurally unsupported).

A user turn gets no delivery: while a session turn is running, an expired timer waits for the next delivery round (suspension window / idle latch); other paths keep the step-boundary behavior.

A pending timer survives across runs; at most 8 timers may be pending at once, and further timer calls are rejected until some expire.
