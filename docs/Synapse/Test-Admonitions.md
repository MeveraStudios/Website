---
title: Custom Admonitions Test
description: Testing custom colored admonitions
order: 99
---

# Custom Admonitions Showcase

Testing the new custom admonition feature with cool colors!

:::info{label="ℹ️ Syntax Guide"}
- **All admonitions with custom properties**: Use `:::type{property="value"}` syntax
- **Standard admonitions**: Use `:::type` without any properties for default styling
- **Custom labels**: Use `:::tip{label="Pro Tip"}` for any admonition type
- **Custom colored admonitions**: Use `:::custom{side-color="#hex" bg-color="#hex" label="Title"}`
  - All three properties are required for custom admonitions
  - Colors can be hex codes or CSS color names
  - Background colors typically use transparency (e.g., `#ff000020`)
:::

## Standard Admonitions

:::note
This is a standard note admonition
:::

:::tip{label="💡 Custom Title"}
This is a tip with a custom title
:::

:::warning
Standard warning admonition
:::

## Custom Colored Admonitions

:::custom{side-color="#ff0080" bg-color="#ff008020" label="🌸 Pink Power"}
This is a beautiful pink admonition! Perfect for highlighting important feminine-themed content or creative ideas.
:::

:::custom{side-color="#00d4ff" bg-color="#00d4ff20" label="🌊 Ocean Wave"}
Dive into this cyan admonition! Great for water-themed content or cool, calming information.
:::

:::custom{side-color="#9d4edd" bg-color="#9d4edd20" label="💜 Purple Reign"}
Royal purple vibes! Excellent for premium features or special announcements.
:::

:::custom{side-color="#ff6b35" bg-color="#ff6b3520" label="🔥 Fire Orange"}
Hot and spicy! This orange admonition demands attention for critical updates.
:::

:::custom{side-color="#06ffa5" bg-color="#06ffa520" label="✨ Mint Fresh"}
Fresh mint green for success messages and positive updates!
:::

:::custom{side-color="#ffd60a" bg-color="#ffd60a20" label="⚡ Electric Yellow"}
Bright and energetic! Perfect for exciting news or important highlights.
:::

:::custom{side-color="#fb5607" bg-color="#fb560720" label="🚀 Rocket Red"}
Launch-ready! This vibrant red-orange is perfect for urgent calls to action.
:::

:::custom{side-color="#00f5ff" bg-color="#00f5ff20" label="❄️ Ice Blue"}
Cool as ice! Great for technical information or system notifications.
:::

:::custom{side-color="#7209b7" bg-color="#7209b720" label="🎭 Deep Purple"}
Mysterious and elegant! Perfect for advanced features or pro tips.
:::

:::custom{side-color="#06fcdf" bg-color="#06fcdf20" label="🌴 Tropical Teal"}
Tropical paradise vibes! Ideal for fun features or community highlights.
:::

:::custom{side-color="#ff006e" bg-color="#ff006e20" label="💖 Hot Pink"}
Bold and beautiful! This hot pink stands out for special promotions.
:::

:::custom{side-color="#8338ec" bg-color="#8338ec20" label="🔮 Mystic Violet"}
Magical and enchanting! Perfect for experimental features or beta content.
:::

## Markdown Support in Labels

:::custom{side-color="#00b4d8" bg-color="#00b4d820" label="**Bold** and *Italic*"}
You can use markdown formatting in the label text!
:::

:::custom{side-color="#f72585" bg-color="#f7258520" label="`Code` in Title"}
Even inline code works in custom titles!
:::

## Mixed Usage

:::danger{label="🚨 CRITICAL"}
Standard danger type with custom title
:::

:::custom{side-color="#ff0000" bg-color="#ff000020" label="🔴 Custom Red Alert"}
Full custom red alert that matches the danger style
:::

:::tip
Back to standard tip without custom title
:::

:::custom{side-color="#3a86ff" bg-color="#3a86ff20" label="ℹ️ Info Style"}
Custom blue that matches the info aesthetic
:::

## Gradient-like Effects using Alpha

:::custom{side-color="#ff006e" bg-color="#ff006e10" label="Light Background"}
Using lower alpha (10 in hex) for subtle background
:::

:::custom{side-color="#ff006e" bg-color="#ff006e30" label="Medium Background"}
Using medium alpha (30 in hex) for more visible background
:::

:::custom{side-color="#ff006e" bg-color="#ff006e50" label="Strong Background"}
Using higher alpha (50 in hex) for strong background
:::

## Creative Use Cases

:::custom{side-color="gold" bg-color="#ffd70020" label="⭐ Premium Feature"}
This uses CSS color names! Gold border for premium content.
:::

:::custom{side-color="silver" bg-color="#c0c0c020" label="🥈 Silver Tier"}
Silver styling for mid-tier features
:::

:::custom{side-color="#cd7f32" bg-color="#cd7f3220" label="🥉 Bronze Level"}
Bronze styling with hex colors
:::

---

## Conclusion

The custom admonition feature allows for unlimited creativity in documentation styling! 🎨

## Icon Customization

You can customize or hide the icon using the `icon` property!

:::note{icon="📌"}
Custom emoji icon - using a pin instead of the default info icon
:::

:::tip{icon="💡"}
Custom lightbulb icon for a bright idea!
:::

:::warning{icon="⚠️"}
Custom warning emoji - more explicit than the default
:::

:::danger{icon="🛑"}
Custom stop sign for danger - very clear visual cue
:::

:::custom{side-color="#00d4ff" bg-color="#00d4ff20" label="Custom with Icon" icon="🌊"}
Custom colored admonition with a wave emoji icon
:::

:::custom{side-color="#7209b7" bg-color="#7209b720" label="Star Rating" icon="⭐"}
Custom admonition with star icon
:::

:::info{icon="🎯"}
Targeting specific information with a custom icon
:::

### Hidden Icons

You can hide icons by setting `icon=""` or `icon=null`:

:::note{label="Clean Note" icon=""}
This note has no icon - just the title and content
:::

:::tip{label="Minimal Tip" icon=""}
Clean and minimal - no icon displayed
:::

:::custom{side-color="#06ffa5" bg-color="#06ffa520" label="Icon-Free Custom" icon=""}
Custom admonition without any icon
:::

### Text Icons

You can even use text characters as icons:

:::note{icon="!"}
Simple exclamation mark icon
:::

:::tip{icon="→"}
Arrow pointing right
:::

:::warning{icon="⚡"}
Lightning bolt for warnings
:::

:::custom{side-color="#ff6b35" bg-color="#ff6b3520" label="Number Icon" icon="1"}
Using a number as the icon
:::
