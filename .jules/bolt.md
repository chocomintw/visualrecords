## YYYY-MM-DD - Initializing Bolt's Journal

**Learning:** Setting up the journal for the first time. This file will track critical, codebase-specific performance learnings.

**Action:** Consistently update this journal with surprising wins, unexpected failures, and unique performance patterns discovered in this repository.
## 2024-08-16 - The Hidden Cost of Lazy Mounting in Tabs

**Learning:** I discovered that optimizing the `shadcn/ui` `Tabs` component by conditionally rendering only the active tab's content introduces a critical functional regression. While it improves initial load performance by lazy-mounting components, it also destroys the state of inactive tabs. When a user navigates away from a tab and then returns, any state within that tab's component (like scroll position, filters, or form inputs) is lost because the component is completely re-mounted. The default eager-rendering behavior, while less performant on initial load, is often essential for preserving a seamless user experience by keeping component state alive.

**Action:** Before optimizing tab components, I must first evaluate whether preserving the UI state across tab switches is a requirement. If it is, I will avoid lazy-mounting optimizations and explore other performance-enhancing strategies, such as memoizing expensive calculations within the tab components themselves or optimizing their individual data fetching. I will not implement an optimization that sacrifices expected user experience for performance without explicit instruction.
