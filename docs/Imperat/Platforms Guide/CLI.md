---
title: "CLI"
description: "The platform for standalone java applications"
order: 7
---

# CLI (Command Line)

The CLI module integrates Imperat with standalone Java console applications. It is lightweight and has no platform dependencies.

## Constructing

```java
CommandLineImperat imperat = CommandLineImperat.builder(System.in)
    .build();
```

The builder requires an `InputStream` (typically `System.in`).

To dispatch a command from the input stream:

```java
imperat.dispatch();                    // uses System output
imperat.dispatch(myConsoleLogger);     // uses a custom ConsoleLogger
```

## Default Argument Types

No platform-specific argument types are pre-registered. Only the core built-in types (String, Integer, Boolean, Double, Float, Long, Enum, UUID, etc.) are available.

## Context Argument Providers

| Type                                    | Value Provided                                     |
|-----------------------------------------|----------------------------------------------------|
| `ExecutionContext<ConsoleCommandSource>` | The current execution context.                     |
| `CommandHelp<ConsoleCommandSource>`     | The command help instance for the current context. |
| `InputStream`                           | The input stream passed to the builder.            |
| `PrintStream`                           | The `PrintStream` of the current source.           |

## Source Providers

| Type          | Behavior                                     |
|---------------|----------------------------------------------|
| `PrintStream` | Returns the underlying `PrintStream` origin. |

## Custom Exceptions

No platform-specific exception classes are defined for CLI.

## Pre-defined Responses

No platform-specific response keys are defined. Only the core `ResponseKey` defaults apply.
# CLI (Command Line)
The CLI module integrates Imperat with standalone Java console applications. It is lightweight and has no platform dependencies.
## Constructing
```java
CommandLineImperat imperat = CommandLineImperat.builder(System.in)
    .build();
```
The builder requires an `InputStream` (typically `System.in`).
To dispatch a command from the input stream:
```java
imperat.execute();                    // uses System output
imperat.execute(myConsoleLogger);     // uses a custom ConsoleLogger
```
## Default Argument Types
No platform-specific argument types are pre-registered. Only the core built-in types (String, Integer, Boolean, Double, Float, Long, Enum, UUID, etc.) are available.
## Context Argument Providers
| Type                                      | Value Provided                              |
|-------------------------------------------|---------------------------------------------|
| `ExecutionContext<ConsoleCommandSource>`   | The current execution context.              |
| `CommandHelp<ConsoleCommandSource>`       | The command help instance for the current context. |
| `InputStream`                             | The input stream passed to the builder.     |
| `PrintStream`                             | The `PrintStream` of the current source.    |
## Source Providers
| Type          | Behavior                                      |
|---------------|-----------------------------------------------|
| `PrintStream` | Returns the underlying `PrintStream` origin.  |
## Custom Exceptions
No platform-specific exception classes are defined for CLI.
## Pre-defined Responses
No platform-specific response keys are defined. Only the core `ResponseKey` defaults apply.
