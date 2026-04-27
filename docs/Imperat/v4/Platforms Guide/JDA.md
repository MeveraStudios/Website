---
title: "JDA (Discord)"
description: "The JDA platform for discord"
order: 6
---

# JDA (Discord)

The JDA module integrates Imperat with Discord bots using JDA (Java Discord API). Commands are automatically mapped to Discord slash commands.

## Constructing

```java
JdaImperat imperat = JdaImperat.builder(jda)
    .build();
```

The builder requires a `JDA` instance.

Commands are automatically synced to Discord as slash commands whenever you register or unregister a command.

## Default Argument Types

| Java Type  | Description                                      |
|------------|--------------------------------------------------|
| `User`     | Resolves a Discord user by ID or mention.        |
| `Member`   | Resolves a guild member by ID or mention.        |
| `Role`     | Resolves a guild role by ID or mention.          |

## Context Argument Providers

| Type                                  | Value Provided                                           |
|---------------------------------------|----------------------------------------------------------|
| `ExecutionContext<JdaCommandSource>`  | The current execution context.                           |
| `CommandHelp<JdaCommandSource>`      | The command help instance for the current context.       |
| `SlashCommandInteractionEvent`       | The underlying JDA slash command event.                  |
| `JDA`                                | The JDA instance passed to the builder.                  |
| `Guild`                              | The guild where the command was invoked.                 |

## Source Providers

| Type     | Behavior                                                               |
|----------|------------------------------------------------------------------------|
| `Member` | Returns the guild member; throws `NoDMSException` if used in DMs.      |
| `User`   | Returns the Discord user who invoked the command.                      |

## Custom Exceptions

| Exception Class            | Trigger                                                              |
|----------------------------|----------------------------------------------------------------------|
| `NoDMSException`           | Thrown when a guild-only command is used in direct messages.          |
| `JdaArgumentParseException`| Thrown when a JDA-specific argument fails to parse.                  |

The `NoDMSException` handler is registered by default and replies with:
`"Command is only available in the dedicated discord server, not DMs"`

## Pre-defined Responses

Held in `JdaResponseKey`.

| Key              | Default Message                  | Placeholders |
|------------------|----------------------------------|--------------|
| `UNKNOWN_USER`   | `"Unknown user: %input%"`        | `input`      |
| `UNKNOWN_MEMBER` | `"Unknown member: %input%"`      | `input`      |
| `UNKNOWN_ROLE`   | `"Unknown role: %input%"`        | `input`      |

