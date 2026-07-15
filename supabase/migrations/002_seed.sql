-- ============================================================
-- SEED: 42 AI Concepts
-- ============================================================
insert into public.ai_concepts (concept_number, name, tier, description, why_pm_needs_it) values
-- Tier 1 — Foundations
(1,  'How LLMs work (tokens, context windows, attention)', 1, 'Large language models predict next tokens using attention mechanisms across a fixed context window', 'PMs need this to scope feasibility, set user expectations around context limits, and explain AI behavior to stakeholders'),
(2,  'Prompt engineering (zero-shot, few-shot, chain-of-thought, system prompts)', 1, 'Techniques for eliciting reliable, structured outputs from LLMs through careful input design', 'PMs design prompts for product features; poor prompting is a product bug, not an engineering bug'),
(3,  'Temperature, top-p, and inference parameters', 1, 'Controls that govern randomness and diversity of LLM outputs', 'Setting wrong parameters causes inconsistent UX — PMs need to spec these for each feature'),
(4,  'Context window management and chunking strategies', 1, 'Methods to fit large documents into limited context windows without losing critical information', 'Drives decisions on document ingestion UX and retrieval architecture'),
(5,  'Tool use / function calling', 1, 'Allowing LLMs to call external APIs or execute code as part of their reasoning', 'Required to spec agentic features — what can the AI do, what can''t it do, who approves actions'),
(6,  'Structured outputs (JSON mode, constrained generation)', 1, 'Forcing LLMs to produce machine-readable formats reliably', 'Critical for any AI feature that feeds into downstream logic or databases'),
(7,  'Model selection: when to use which model', 1, 'Trade-offs between model size, cost, speed, and capability across the Claude/GPT/Gemini families', 'PMs make build-vs-buy and model selection decisions constantly — this is core PM judgment'),
(8,  'Build vs fine-tune vs RAG vs prompt decision tree', 1, 'Framework for choosing the right AI architecture for a given product requirement', 'Most common technical scoping decision a PM will make on an AI product'),
(9,  'Embeddings: what they are, what they enable', 1, 'Numerical representations of text that capture semantic meaning for similarity search and retrieval', 'Required to understand search, recommendations, and semantic matching features'),
(10, 'Vector databases (pgvector, Pinecone, Weaviate)', 1, 'Databases optimized for storing and querying embedding vectors at scale', 'PMs need to evaluate infra options and understand latency/cost trade-offs'),
-- Tier 2 — Core Technical
(11, 'RAG — architecture, use cases, failure modes', 2, 'Retrieval-Augmented Generation: combining document retrieval with LLM generation to answer questions over private data', 'Most enterprise AI products use RAG — PMs must understand when it fails and how to fix it'),
(12, 'Fine-tuning — when it''s worth it, data requirements, cost, risks', 2, 'Adapting a base model on domain-specific data to improve performance on specific tasks', 'PMs are asked "should we fine-tune?" constantly — this concept gives the answer framework'),
(13, 'Evals — how to measure LLM output quality (RAGAS, LLM-as-judge, human eval)', 2, 'Systematic approaches to measuring whether AI outputs are accurate, safe, and on-brand', 'AI product quality is not testable with standard QA — PMs must define eval criteria as a product requirement'),
(14, 'Agentic systems — failure modes, human-in-the-loop design', 2, 'AI systems that take sequences of actions autonomously, with checkpoints for human oversight', 'Shipping an agent without understanding failure modes is a trust and safety risk'),
(15, 'Multi-agent orchestration — when to use multiple agents vs one', 2, 'Patterns for dividing complex tasks across specialized AI agents that collaborate', 'PMs designing complex AI workflows need to spec agent boundaries and handoffs'),
(16, 'Latency and cost optimization (caching, batching, model cascading)', 2, 'Techniques to reduce inference cost and response time without degrading output quality', 'AI features often fail on cost or latency grounds — PMs must spec budgets and acceptable trade-offs'),
(17, 'AI product metrics (adoption, trust, task completion — beyond accuracy)', 2, 'Metrics specific to AI features that go beyond traditional model accuracy', 'Standard product metrics miss what makes AI features succeed or fail with users'),
(18, 'Multimodal AI — vision, audio, video — PM implications', 2, 'AI models that process and generate across text, images, audio, and video', 'PMs scoping AI features must know what modalities are feasible and at what cost'),
(19, 'Streaming and real-time AI outputs — UX and technical implications', 2, 'Techniques for displaying AI outputs token-by-token as they are generated', 'Streaming changes UX design fundamentally — PMs must spec it correctly to avoid poor perceived performance'),
(20, 'AI hallucination — types, causes, PM mitigation strategies', 2, 'When LLMs confidently generate false information, and product-level strategies to reduce harm', 'Trust and safety; hallucinations in the wrong product context are a legal and brand risk'),
-- Tier 3 — Applied PM Skills
(21, 'Writing an AI product spec (how it differs from a standard PRD)', 3, 'How to specify AI feature requirements including model behavior, eval criteria, fallback logic, and observability', 'Standard PRD templates fail for AI — PMs need a different spec format'),
(22, 'AI roadmapping — prioritizing when outcomes are probabilistic', 3, 'Frameworks for prioritizing AI features when success probability and impact are uncertain', 'AI projects have higher variance than traditional software — prioritization frameworks must account for this'),
(23, 'Human-in-the-loop design patterns', 3, 'UX and system patterns for keeping humans appropriately in control of AI-driven workflows', 'Regulatory and trust requirements increasingly mandate HITL design — PMs must know the patterns'),
(24, 'AI product pricing models', 3, 'How to price AI features given variable inference costs, usage patterns, and value delivered', 'AI changes the unit economics of SaaS — PMs must understand cost-to-serve before pricing'),
(25, 'Data flywheels — how AI products improve with use', 3, 'Feedback loops where user interactions generate training signal that improves model quality over time', 'PMs use data flywheel thinking to design features that compound in value — key competitive moat'),
(26, 'Responsible AI: fairness, bias, explainability', 3, 'Principles and practices for building AI that treats users fairly and can explain its decisions', 'Required for any externally-facing AI feature — now a regulatory expectation in most markets'),
(27, 'AI safety basics — alignment, red-teaming, guardrails', 3, 'Methods for preventing AI systems from producing harmful, off-topic, or unsafe outputs', 'PMs must spec guardrails as product requirements, not afterthoughts'),
(28, 'MLOps — model deployment, monitoring, drift detection (PM level)', 3, 'Practices for deploying, monitoring, and maintaining ML models in production', 'PMs own the product quality of AI features post-launch — understanding MLOps tells them what to monitor'),
(29, 'AI regulations: EU AI Act, India''s AI policy framework, sector rules', 3, 'Current and emerging legal requirements governing AI product development and deployment', 'PMs in Hyderabad market need to understand India-specific AI policy as it develops'),
(30, 'Synthetic data — what it is, when to use it', 3, 'Artificially generated data used to train or test AI models when real data is scarce or private', 'PMs decide when synthetic data is acceptable — wrong calls create model reliability issues'),
-- Tier 4 — Frontier
(31, 'Reasoning models (o1/Claude-style) — when they win and when they don''t', 4, 'Models that use extended chain-of-thought reasoning to solve complex multi-step problems', 'PMs must know when a reasoning model is worth the higher cost and latency vs a standard model'),
(32, 'Computer use / browser agents — product implications', 4, 'AI that can operate a web browser or desktop application autonomously', 'Emerging product category with significant trust, safety, and UX design implications'),
(33, 'Memory systems in AI products — short-term, long-term, episodic', 4, 'Architectures for giving AI systems persistent context across sessions', 'PMs designing personalized AI features must understand memory trade-offs and user privacy implications'),
(34, 'AI in operations and logistics — state of the art, key players', 4, 'Current AI applications in supply chain, warehouse management, and delivery operations', 'Sai''s domain depth — knowing the landscape of competitors and capabilities is a Principal PM requirement'),
(35, 'Foundation vs fine-tuned vs small model trade-offs', 4, 'Decision framework for choosing model type based on capability, cost, privacy, and latency requirements', 'Enterprise AI product decisions hinge on this trade-off — PMs must be able to facilitate the conversation'),
(36, 'Prompt injection and AI security — PM awareness level', 4, 'Attacks where malicious inputs hijack AI system behavior, and defenses against them', 'PMs shipping AI features that process user or third-party content must understand this attack surface'),
(37, 'LLM benchmarks — what they measure, how PMs use them', 4, 'Standard evaluation datasets used to compare model capabilities across reasoning, coding, and knowledge tasks', 'PMs use benchmarks to justify model selection to leadership and evaluate vendor claims'),
(38, 'Knowledge graphs + LLMs — hybrid approaches', 4, 'Combining structured knowledge representations with LLM generation for more reliable factual outputs', 'Emerging architecture for enterprise AI where accuracy on structured domains matters'),
(39, 'AI product analytics — how to instrument an AI product', 4, 'Approaches to logging, tracing, and measuring AI feature performance in production', 'PMs cannot improve what they cannot measure — AI observability is a product requirement, not just an engineering concern'),
(40, 'Economics of AI products — GPU/inference costs, margin implications', 4, 'How inference costs affect product margin and when AI features are economically viable at scale', 'Required for business case development and pricing decisions on any AI product'),
(41, 'Open source vs closed models — enterprise risk/benefit', 4, 'Trade-offs between using open-source LLMs vs commercial APIs for enterprise products', 'Data privacy, customization, and cost requirements drive this decision — PMs need the framework'),
(42, 'AI in regulated industries — compliance patterns', 4, 'How AI products are built differently in healthcare, finance, and other regulated sectors', 'Relevant for Hyderabad market where fintech and healthtech are major PM employers');

-- ============================================================
-- SEED: Curriculum Units 1–34
-- ============================================================
insert into public.curriculum_units (unit_number, phase, primary_theme, required_ai_concept_tier, pow_type_constraint, is_interview_heavy, is_materials_heavy) values
-- Tier 1 AI concepts (units 1–10)
(1,  'phase1', 'GenAI & AI concepts', 1, 'linkedin_post', false, false),
(2,  'phase1', 'GenAI & AI concepts', 1, 'linkedin_post', false, false),
(3,  'phase1', 'Platform & Principal PM thinking', 1, 'product_spec', false, false),
(4,  'phase1', 'Executive communication & owner framing', 1, 'linkedin_post', false, false),
(5,  'phase1', 'GenAI & AI concepts', 1, 'github_repo', false, false),
(6,  'phase1', 'Hyderabad market & target company knowledge', 1, 'notion_doc', false, false),
(7,  'phase1', 'GenAI & AI concepts', 1, 'linkedin_post', false, false),
(8,  'phase1', 'Platform & Principal PM thinking', 1, 'product_spec', false, false),
(9,  'phase1', 'Interview readiness & story building', 1, 'notion_doc', true, false),
(10, 'phase1', 'Application materials & external visibility', 1, 'linkedin_post', false, true),
-- Tier 2 AI concepts (units 11–20)
(11, 'phase1', 'GenAI & AI concepts', 2, 'github_repo', false, false),
(12, 'phase1', 'GenAI & AI concepts', 2, 'linkedin_post', false, false),
(13, 'phase1', 'Platform & Principal PM thinking', 2, 'product_spec', false, false),
(14, 'phase1', 'Executive communication & owner framing', 2, 'linkedin_post', false, false),
(15, 'phase1', 'GenAI & AI concepts', 2, 'github_repo', false, false),
(16, 'phase1', 'Hyderabad market & target company knowledge', 2, 'notion_doc', false, false),
(17, 'phase1', 'Interview readiness & story building', 2, 'notion_doc', true, false),
(18, 'phase1', 'GenAI & AI concepts', 2, 'linkedin_post', false, false),
(19, 'phase1', 'Platform & Principal PM thinking', 2, 'product_spec', false, false),
(20, 'phase1', 'Application materials & external visibility', 2, 'linkedin_post', false, true),
-- Tier 3 AI concepts (units 21–26)
(21, 'phase1', 'GenAI & AI concepts', 3, 'product_spec', false, false),
(22, 'phase1', 'Platform & Principal PM thinking', 3, 'product_spec', false, false),
(23, 'phase1', 'Executive communication & owner framing', 3, 'linkedin_post', false, false),
(24, 'phase1', 'Interview readiness & story building', 3, 'notion_doc', true, false),
(25, 'phase1', 'Hyderabad market & target company knowledge', 3, 'notion_doc', false, false),
(26, 'phase1', 'GenAI & AI concepts', 3, 'linkedin_post', false, false),
-- Tier 4 AI concepts (units 27–34)
(27, 'phase1', 'GenAI & AI concepts', 4, 'github_repo', false, false),
(28, 'phase1', 'Platform & Principal PM thinking', 4, 'product_spec', false, false),
(29, 'phase1', 'Interview readiness & story building', 4, 'notion_doc', true, false),
(30, 'phase1', 'Executive communication & owner framing', 4, 'linkedin_post', false, false),
(31, 'phase1', 'Application materials & external visibility', 4, 'linkedin_post', false, true),
(32, 'phase1', 'GenAI & AI concepts', 4, 'github_repo', false, false),
(33, 'phase1', 'Hyderabad market & target company knowledge', 4, 'notion_doc', false, false),
(34, 'phase1', 'Interview readiness & story building', 4, 'product_spec', true, true);

-- ============================================================
-- SEED: Blocked Names (NDA Registry)
-- ============================================================
-- NOTE: These are inserted per-user after account creation via the application.
-- The handle_new_user trigger creates the user record.
-- Blocked names are user-specific; seed via app onboarding.
