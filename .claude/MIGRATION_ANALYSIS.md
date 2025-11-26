# Claude Code to Cursor Rules Migration Analysis

## Executive Summary

The `.claude` directory contains a comprehensive Claude Code configuration with:
- **5 Sub-agents** (specialized assistants)
- **4 Skills** (task-specific guides)
- **4 Hooks** (bash scripts for validation)
- **Configuration files** (config.json, settings.local.json)

**Migration Status**: Most content can be migrated to Cursor rules, but some functionality is Claude Code-specific and cannot be directly replicated.

---

## What CAN Be Migrated

### ✅ 1. Agent Knowledge → Cursor Rules

All 5 agents contain valuable patterns and best practices that can be extracted into Cursor rules:

#### `dev-assistant.md` → Can merge into `general.mdc`
- **Content**: Cloudflare Workers patterns, monorepo guidance, auto-import suggestions
- **Migration**: Add to `general.mdc` or create `development.mdc`
- **Key Sections**:
  - Auto-import intelligence for `@cf-monorepo/*` packages
  - Context awareness (apps vs packages)
  - Command suggestions based on context

#### `test-strategist.md` → New `testing.mdc` rule
- **Content**: Comprehensive testing strategies for Workers
- **Migration**: Create new `testing.mdc` file
- **Key Sections**:
  - Edge computing testing challenges
  - Vitest patterns for Workers
  - Database testing strategies
  - Integration testing patterns
  - Performance testing

#### `security-auditor.md` → New `security.mdc` rule
- **Content**: Security patterns and validation checklists
- **Migration**: Create new `security.mdc` file
- **Key Sections**:
  - Security validation checklist
  - Authentication/authorization patterns
  - Input validation patterns
  - Secret management guidelines

#### `perf-optimizer.md` → New `performance.mdc` rule
- **Content**: Performance optimization for Workers
- **Migration**: Create new `performance.mdc` file
- **Key Sections**:
  - Bundle size optimization
  - Database query optimization
  - Memory management
  - Runtime constraints (128MB, CPU limits)

#### `api-designer.md` → Enhance `hono.mdc` or create `api-design.mdc`
- **Content**: API design patterns and OpenAPI integration
- **Migration**: Add to `hono.mdc` or create separate `api-design.mdc`
- **Key Sections**:
  - RESTful API patterns
  - OpenAPI specification patterns
  - Error handling patterns
  - API versioning strategies

### ✅ 2. Skills → Cursor Rules

All 4 skills contain actionable guidance that can become rules:

#### `db-migrations/SKILL.md` → Enhance `drizzle.mdc`
- **Content**: Database migration best practices
- **Migration**: Add migration section to `drizzle.mdc`
- **Key Sections**:
  - Schema analysis and breaking change detection
  - Migration generation strategies
  - Production deployment guidance
  - Better Auth compatibility

#### `worker-scaffolding/SKILL.md` → Enhance `general.mdc`
- **Content**: Worker creation patterns
- **Migration**: Add scaffolding section to `general.mdc`
- **Key Sections**:
  - Architecture pattern recognition
  - Dependency selection guidance
  - Configuration generation patterns

#### `deployment-readiness/SKILL.md` → New `deployment.mdc` rule
- **Content**: Pre-deployment validation checklist
- **Migration**: Create new `deployment.mdc` file
- **Key Sections**:
  - Pre-deployment validation checklist
  - Environment configuration checks
  - Security assessment
  - Performance analysis

#### `docs-automation/SKILL.md` → New `documentation.mdc` rule (optional)
- **Content**: Documentation generation patterns
- **Migration**: Create `documentation.mdc` if documentation automation is desired
- **Key Sections**:
  - API documentation from OpenAPI
  - README generation patterns
  - Architecture documentation

### ✅ 3. Hook Logic → Rule Guidance

Hook validation logic can be converted to rule-based guidance:

#### `quality-gate` → Add to `general.mdc` or `security.mdc`
- **Checks**: Security patterns, debug statement detection
- **Migration**: Add quality checks section to rules
- **Guidance**: "Before committing code, check for: process.env usage, console.log statements, etc."

#### `deployment-check` → Add to `deployment.mdc`
- **Checks**: Comprehensive pre-deployment validation
- **Migration**: Convert bash checks to rule-based checklist
- **Guidance**: "Before deploying, ensure: git status clean, tests pass, type checks pass, etc."

---

## What CANNOT Be Migrated

### ❌ 1. Hook Execution System

**Claude Code Hooks**:
- Bash scripts that execute automatically before/after tool usage
- Pre-Edit hooks that validate code before modifications
- Post-Tool hooks for logging

**Cursor Limitation**: 
- Cursor doesn't have an equivalent hook system
- Rules are guidance, not executable scripts
- Cannot automatically run validation before edits

**Workaround**: 
- Convert hook logic to rule-based checklists
- Add guidance like "Before deploying, run: `just check && just test`"

### ❌ 2. Agent System

**Claude Code Agents**:
- Specialized sub-agents that activate based on context
- Different models per agent (sonnet)
- Tool restrictions per agent

**Cursor Limitation**:
- Cursor uses a single AI model
- Rules are always applied (or conditionally via globs)
- Cannot have specialized "agents" that activate contextually

**Workaround**:
- Organize rules by topic (testing.mdc, security.mdc, etc.)
- Use globs to apply rules contextually
- Use `alwaysApply: true` for critical rules

### ❌ 3. Configuration System

**Claude Code Config**:
- `config.json` with hook matchers and triggers
- `settings.local.json` with permissions

**Cursor Limitation**:
- Cursor rules don't have a configuration system
- No equivalent to hook matchers or permission settings

**Workaround**:
- Not needed - Cursor handles this differently
- Rules are applied based on file patterns (globs)

---

## Recommended Migration Plan

### Phase 1: High-Value Rules (Immediate)

1. **Create `testing.mdc`** from `test-strategist.md`
   - Comprehensive testing patterns
   - Vitest setup for Workers
   - Integration testing strategies

2. **Create `security.mdc`** from `security-auditor.md`
   - Security validation checklist
   - Authentication patterns
   - Secret management

3. **Create `performance.mdc`** from `perf-optimizer.md`
   - Bundle optimization
   - Database query optimization
   - Runtime constraints

4. **Create `deployment.mdc`** from `deployment-readiness/SKILL.md`
   - Pre-deployment checklist
   - Environment validation
   - Production readiness

### Phase 2: Enhance Existing Rules

1. **Enhance `general.mdc`** with:
   - Auto-import intelligence from `dev-assistant.md`
   - Scaffolding patterns from `worker-scaffolding/SKILL.md`
   - Quality checks from `quality-gate` hook

2. **Enhance `drizzle.mdc`** with:
   - Migration strategies from `db-migrations/SKILL.md`
   - Better Auth integration patterns

3. **Enhance `hono.mdc`** with:
   - API design patterns from `api-designer.md`
   - OpenAPI integration details

### Phase 3: Optional Rules

1. **Create `api-design.mdc`** (if API design is a focus)
   - RESTful patterns
   - API versioning
   - OpenAPI specifications

2. **Create `documentation.mdc`** (if documentation automation is desired)
   - README generation
   - API documentation
   - Architecture docs

---

## Migration Checklist

### Content Extraction

- [ ] Extract testing patterns from `test-strategist.md` → `testing.mdc`
- [ ] Extract security patterns from `security-auditor.md` → `security.mdc`
- [ ] Extract performance patterns from `perf-optimizer.md` → `performance.mdc`
- [ ] Extract deployment checklist from `deployment-readiness/SKILL.md` → `deployment.mdc`
- [ ] Extract dev guidance from `dev-assistant.md` → enhance `general.mdc`
- [ ] Extract API patterns from `api-designer.md` → enhance `hono.mdc` or create `api-design.mdc`
- [ ] Extract migration patterns from `db-migrations/SKILL.md` → enhance `drizzle.mdc`
- [ ] Extract scaffolding patterns from `worker-scaffolding/SKILL.md` → enhance `general.mdc`

### Hook Logic Conversion

- [ ] Convert `quality-gate` checks to rule guidance
- [ ] Convert `deployment-check` validation to `deployment.mdc` checklist
- [ ] Document manual validation steps (since hooks can't auto-run)

### Rule Organization

- [ ] Ensure all new rules follow existing format (frontmatter with description, globs)
- [ ] Add appropriate globs for contextual application
- [ ] Mark critical rules with `alwaysApply: true` if needed
- [ ] Cross-reference related rules

### Testing

- [ ] Verify rules are being applied correctly
- [ ] Test rule globs match intended files
- [ ] Ensure no conflicts with existing rules

---

## Format Conversion Notes

### Claude Code Agent Format
```markdown
---
name: agent-name
description: ...
tools: [...]
model: sonnet
---

Content here...
```

### Cursor Rule Format
```markdown
---
description: ...
globs: ["**/*.ts", "apps/**/*.ts"]
alwaysApply: true  # optional
---

Content here...
```

**Key Differences**:
- No `name` field (filename is the name)
- No `tools` or `model` fields
- Use `globs` instead of tool restrictions
- Use `alwaysApply` for critical rules

---

## Summary

**Migratable Content**: ~90%
- All agent knowledge → Rules
- All skill guidance → Rules
- Hook validation logic → Rule checklists

**Non-Migratable**: ~10%
- Hook execution system (bash scripts)
- Agent system (specialized sub-agents)
- Configuration system (hook matchers)

**Recommendation**: Proceed with migration, focusing on high-value rules first (testing, security, performance, deployment). The hook execution system can be replaced with manual checklists and guidance in rules.

