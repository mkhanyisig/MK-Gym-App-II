---
name: Spec
about: The implementation contract. Only the owner adds ready-for-agent, after approving it.
title: 'Spec: '
labels: ''
assignees: mkhanyisig
---

<!--
Link the Decision issue or Decisions comment, any design note (docs/design/...), and the parent.
For a small change, add a short "Decisions" section here instead of a separate Decision issue.
Use GLOSSARY.md terms. If a term changes, update GLOSSARY.md in the first commit.
-->

Spec for #. Decisions: link. Design: link.

## Problem

## Solution

The behaviour, in glossary terms.

## User stories

<!-- As many as needed to cover the important happy paths, edge cases and invariants (including "nothing changes when…"). Number them. -->

1. As a user, I want …, so that …

## Acceptance criteria

<!-- Observable, checkable outcomes. Link them to user stories where helpful. -->

- [ ] …

## Engineering constraints

<!-- Include only what applies. Leave out sections that don't. For example: data and state (records, derived values, invariants); transactions and failure handling; migration and compatibility; offline, performance or privacy. -->

## Test strategy

- **Interfaces under test:** the public functions, repositories or screens the tests drive.
- **Prior art:** existing tests to follow.
- **Names:** test names in glossary terms.
- **Not unit-testable:** covered by the device checks below.

## Device checks (owner)

<!-- Classify each unexpected result: Fix (our bug), Reopen (a Decision's assumption failed: open a new issue from the fallback and pause only dependent work), or Measure (record the number). -->

- [ ] …

## Out of scope

## Dependencies

## Owner approval

<!-- Only the owner ticks these and adds the ready-for-agent label. -->

- [ ] User stories cover the important paths, edge cases and invariants.
- [ ] Engineering decisions and constraints are approved.
- [ ] Test strategy and device checks are approved.

## Closure

<!--
When done, post a closing comment with:
- each Decision mapped to its test or device result
- the PR link
- device check outcomes

For significant features, add "## Engineering reflection", answered by the owner (not Claude):
1. What would I decide differently?
2. What surprised me?
3. What should change in how we plan?
-->
