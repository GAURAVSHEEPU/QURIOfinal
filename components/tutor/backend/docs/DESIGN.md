# Visual Design System Document

## 1. Design Theme
**Quantum Dark / Futuristic Scientific**

The visual aesthetic balances high-tech scientific precision with a sleek, modern UI. It avoids cheap gaming/cyberpunk overload in favor of a clean, academic-grade dark interface suitable for quantum researchers, students, and hackathon judges.

## 2. Color Palette

```
  Background      Surface         Primary         Secondary
 ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 │ #0B1020  │    │ #111827  │    │ #7C3AED  │    │ #06B6D4  │
 └──────────┘    └──────────┘    └──────────┘    └──────────┘

   Success         Warning          Error        Primary Text
 ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 │ #22C55E  │    │ #F59E0B  │    │ #EF4444  │    │ #F8FAFC  │
 └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

- **Background:** `#0B1020` (Deep Space Dark Blue)
- **Surface / Card Background:** `#111827` (Dark Neutral Gray)
- **Primary Accent:** `#7C3AED` (Quantum Violet)
- **Secondary Accent:** `#06B6D4` (Cyan Energy)
- **Success:** `#22C55E` (Emerald Green)
- **Warning:** `#F59E0B` (Amber Gold)
- **Error / Risk:** `#EF4444` (Rose Red)
- **Primary Text:** `#F8FAFC` (Slate 50 White)
- **Secondary Text:** `#94A3B8` (Slate 400 Muted Gray)

## 3. Typography

- **Primary UI Font:** `Inter`, system-ui, sans-serif
- **Code & Technical Font:** `JetBrains Mono`, `Fira Code`, monospace

### Typography Scale
- **Page Title:** 32–40px, Bold (700), tracking tight
- **Section Heading:** 24–28px, SemiBold (600)
- **Card Heading:** 18–20px, SemiBold (600)
- **Body Text:** 14–16px, Regular (400), leading relaxed
- **Caption / Metadata:** 12–13px, Medium (500), muted color
- **Code / Metrics:** 13–14px, `JetBrains Mono`

## 4. UI Principles

1. **High Contrast & Readability:** Crisp `#F8FAFC` text on `#111827` dark cards ensures effortless reading during long study sessions.
2. **Modular Clean Cards:** UI components are encapsulated inside distinct cards with subtle 1px border highlights (`#1F2937`).
3. **Clear Visual Hierarchy:** Direct user focus using typography scale and color accenting.
4. **Transparent AI Reasoning:** Highlight ML prediction confidence scores, risk probabilities, and Critic iteration metrics in dedicated badges.
5. **Data Visualization:** Use clean charts (Matplotlib / Chart.js) with Quantum Violet and Cyan palettes for risk radars and progress curves.

