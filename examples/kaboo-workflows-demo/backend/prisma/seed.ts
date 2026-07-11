import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.review.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.companySegment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.marketSegment.deleteMany();
  await prisma.company.deleteMany();

  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: "NovaCoreAI",
        sector: "Cloud Infrastructure",
        founded: 2016,
        hq: "San Francisco, CA",
        employees: 4200,
        description:
          "Enterprise GPU cloud platform specializing in high-performance AI training and inference workloads.",
        website: "https://novacoreai.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "VectorFlow",
        sector: "Data Infrastructure",
        founded: 2019,
        hq: "New York, NY",
        employees: 850,
        description:
          "Purpose-built vector database for semantic search, recommendation systems, and RAG pipelines.",
        website: "https://vectorflow.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "SynthLabs",
        sector: "AI/ML",
        founded: 2020,
        hq: "London, UK",
        employees: 620,
        description:
          "LLM API platform offering fine-tuning, inference, and evaluation services for enterprise AI.",
        website: "https://synthlabs.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "Cerebrum Cloud",
        sector: "Cloud Infrastructure",
        founded: 2017,
        hq: "Seattle, WA",
        employees: 3100,
        description:
          "Multi-cloud GPU marketplace aggregating capacity from global data centers for ML workloads.",
        website: "https://cerebrumcloud.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "PineCrest Data",
        sector: "Data Infrastructure",
        founded: 2019,
        hq: "Austin, TX",
        employees: 540,
        description:
          "Managed vector database service with serverless scaling and built-in hybrid search.",
        website: "https://pinecrestdata.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "Anthropic Systems",
        sector: "AI/ML",
        founded: 2021,
        hq: "San Francisco, CA",
        employees: 1800,
        description:
          "AI safety company building reliable, steerable, and interpretable AI systems.",
        website: "https://anthropicsystems.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "TensorDock",
        sector: "Cloud Infrastructure",
        founded: 2020,
        hq: "Toronto, Canada",
        employees: 180,
        description:
          "Budget-friendly GPU cloud provider offering spot and on-demand instances for AI training.",
        website: "https://tensordock.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "QueryMind",
        sector: "AI/ML",
        founded: 2022,
        hq: "Berlin, Germany",
        employees: 210,
        description:
          "AI-powered analytics platform that lets business users query data in natural language.",
        website: "https://querymind.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "DataNexus",
        sector: "Data Infrastructure",
        founded: 2018,
        hq: "Chicago, IL",
        employees: 1200,
        description:
          "Unified data lakehouse platform with integrated vector search and real-time analytics.",
        website: "https://datanexus.example.com",
      },
    }),
    prisma.company.create({
      data: {
        name: "CloudScale GPU",
        sector: "Cloud Infrastructure",
        founded: 2021,
        hq: "Singapore",
        employees: 350,
        description:
          "Asia-Pacific focused GPU cloud with edge inference nodes and low-latency API endpoints.",
        website: "https://cloudscalegpu.example.com",
      },
    }),
  ]);

  const [
    novacore,
    vectorflow,
    synthlabs,
    cerebrum,
    pinecrest,
    anthropic,
    tensordock,
    querymind,
    datanexus,
    cloudscale,
  ] = companies;

  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: novacore.id,
        name: "NovaTrain Pro",
        category: "Cloud GPU",
        launchDate: new Date("2022-03-15"),
        description: "Dedicated GPU clusters for large-scale model training with NVIDIA H100s.",
        features: ["H100 80GB", "InfiniBand networking", "Multi-node training", "Spot pricing"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: novacore.id,
        name: "NovaInfer",
        category: "Cloud GPU",
        launchDate: new Date("2023-06-01"),
        description: "Low-latency inference endpoints with auto-scaling and model caching.",
        features: ["A100/H100", "Auto-scaling", "Model registry", "99.99% SLA"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: novacore.id,
        name: "NovaStore",
        category: "Cloud Storage",
        launchDate: new Date("2023-09-10"),
        description: "High-throughput object storage optimized for ML dataset management.",
        features: ["S3-compatible", "Dataset versioning", "Streaming reads", "10 Gbps throughput"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: vectorflow.id,
        name: "VectorFlow DB",
        category: "Vector Database",
        launchDate: new Date("2021-01-20"),
        description: "Distributed vector database with HNSW indexing and metadata filtering.",
        features: ["HNSW index", "Metadata filters", "Multi-tenancy", "REST & gRPC APIs"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: vectorflow.id,
        name: "VectorFlow Pipelines",
        category: "Data Pipeline",
        launchDate: new Date("2023-11-05"),
        description: "Automated embedding pipelines for ingesting documents into VectorFlow DB.",
        features: ["Auto-chunking", "30+ connectors", "Incremental sync", "Built-in embeddings"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: synthlabs.id,
        name: "SynthAPI",
        category: "LLM API",
        launchDate: new Date("2022-08-12"),
        description: "Unified API gateway for accessing multiple LLMs with a single integration.",
        features: ["Multi-model routing", "Prompt caching", "Rate limiting", "Usage analytics"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: synthlabs.id,
        name: "SynthTune",
        category: "LLM API",
        launchDate: new Date("2023-04-18"),
        description: "No-code fine-tuning platform for customizing LLMs on proprietary data.",
        features: ["LoRA fine-tuning", "Dataset management", "A/B evaluation", "One-click deploy"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: cerebrum.id,
        name: "Cerebrum Marketplace",
        category: "Cloud GPU",
        launchDate: new Date("2021-07-01"),
        description: "Multi-cloud GPU marketplace with real-time pricing from 15+ providers.",
        features: ["Price comparison", "Spot instances", "Multi-region", "Kubernetes integration"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: cerebrum.id,
        name: "Cerebrum MLOps",
        category: "MLOps",
        launchDate: new Date("2023-01-22"),
        description: "End-to-end ML pipeline orchestration with experiment tracking and model registry.",
        features: ["Experiment tracking", "Model registry", "Pipeline DAGs", "GPU scheduling"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: pinecrest.id,
        name: "PineCrest Vector",
        category: "Vector Database",
        launchDate: new Date("2021-09-15"),
        description: "Serverless vector database with automatic scaling and zero operational overhead.",
        features: ["Serverless", "Hybrid search", "Namespaces", "Sparse-dense vectors"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: pinecrest.id,
        name: "PineCrest Assistant",
        category: "AI Application",
        launchDate: new Date("2024-02-01"),
        description: "RAG-as-a-service platform built on PineCrest Vector for enterprise knowledge bases.",
        features: ["Built-in RAG", "File upload", "Citation tracking", "API & SDK"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: anthropic.id,
        name: "Claude Enterprise",
        category: "LLM API",
        launchDate: new Date("2023-07-11"),
        description: "Enterprise-grade LLM API with extended context windows and safety guardrails.",
        features: ["200K context", "Tool use", "System prompts", "Enterprise SSO"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: anthropic.id,
        name: "Claude Workbench",
        category: "AI Application",
        launchDate: new Date("2024-01-15"),
        description: "Interactive prompt engineering and evaluation platform for Claude models.",
        features: ["Prompt playground", "Batch eval", "Version history", "Team collaboration"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: tensordock.id,
        name: "TensorDock Compute",
        category: "Cloud GPU",
        launchDate: new Date("2022-02-10"),
        description: "Affordable GPU instances starting at $0.20/hr with global availability.",
        features: ["A100/A6000/RTX4090", "Spot pricing", "Hourly billing", "Docker support"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: tensordock.id,
        name: "TensorDock Kubernetes",
        category: "Cloud GPU",
        launchDate: new Date("2023-08-20"),
        description: "Managed Kubernetes clusters with GPU node pools for scalable ML deployments.",
        features: ["GPU node pools", "Auto-scaling", "Persistent volumes", "Helm charts"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: querymind.id,
        name: "QueryMind Analytics",
        category: "AI Application",
        launchDate: new Date("2023-03-01"),
        description: "Natural language analytics platform that converts questions into SQL queries.",
        features: ["NL-to-SQL", "Dashboard builder", "Data connectors", "Scheduled reports"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: querymind.id,
        name: "QueryMind Embedded",
        category: "AI Application",
        launchDate: new Date("2024-01-10"),
        description: "White-label analytics component for embedding NL queries into SaaS products.",
        features: ["React SDK", "Custom branding", "Multi-tenant", "SSO integration"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: datanexus.id,
        name: "DataNexus Lakehouse",
        category: "Data Platform",
        launchDate: new Date("2020-11-01"),
        description: "Unified data lakehouse with SQL, streaming, and vector search in one engine.",
        features: ["Delta Lake", "SQL analytics", "Streaming ingest", "Vector search"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: datanexus.id,
        name: "DataNexus AI",
        category: "AI Application",
        launchDate: new Date("2023-10-15"),
        description: "AI-powered data quality, lineage tracking, and governance for the lakehouse.",
        features: ["Auto-profiling", "Data lineage", "Anomaly detection", "Access controls"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: cloudscale.id,
        name: "CloudScale Inference",
        category: "Cloud GPU",
        launchDate: new Date("2023-05-01"),
        description: "Edge-optimized inference nodes across Asia-Pacific with sub-50ms latency.",
        features: ["Edge nodes", "APAC coverage", "TensorRT", "gRPC endpoints"],
      },
    }),
    prisma.product.create({
      data: {
        companyId: cloudscale.id,
        name: "CloudScale Train",
        category: "Cloud GPU",
        launchDate: new Date("2024-01-20"),
        description: "Multi-GPU training clusters with NVLink and high-bandwidth networking.",
        features: ["H100 clusters", "NVLink", "400 Gbps networking", "Checkpoint storage"],
      },
    }),
  ]);

  const segments = await Promise.all([
    prisma.marketSegment.create({
      data: {
        name: "Cloud GPU",
        description: "On-demand GPU compute for AI/ML training and inference",
        totalMarketSize: 45.2,
        growthRate: 32.5,
      },
    }),
    prisma.marketSegment.create({
      data: {
        name: "LLM API",
        description: "Large language model inference APIs and platforms",
        totalMarketSize: 18.7,
        growthRate: 68.3,
      },
    }),
    prisma.marketSegment.create({
      data: {
        name: "Vector Database",
        description: "Specialized databases for vector similarity search and RAG",
        totalMarketSize: 3.2,
        growthRate: 85.1,
      },
    }),
    prisma.marketSegment.create({
      data: {
        name: "MLOps",
        description: "ML lifecycle management, experiment tracking, and model deployment",
        totalMarketSize: 8.4,
        growthRate: 28.7,
      },
    }),
    prisma.marketSegment.create({
      data: {
        name: "AI Analytics",
        description: "AI-powered business intelligence and natural language data querying",
        totalMarketSize: 12.1,
        growthRate: 41.2,
      },
    }),
    prisma.marketSegment.create({
      data: {
        name: "Data Platform",
        description: "Unified data lakehouse and data management platforms",
        totalMarketSize: 22.8,
        growthRate: 19.4,
      },
    }),
  ]);

  const [gpuSeg, llmSeg, vecSeg, mlopsSeg, analyticsSeg, dataSeg] = segments;

  await Promise.all([
    prisma.companySegment.create({ data: { companyId: novacore.id, segmentId: gpuSeg.id, marketShare: 18.5, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: novacore.id, segmentId: gpuSeg.id, marketShare: 15.2, year: 2023 } }),
    prisma.companySegment.create({ data: { companyId: cerebrum.id, segmentId: gpuSeg.id, marketShare: 12.3, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: cerebrum.id, segmentId: gpuSeg.id, marketShare: 10.1, year: 2023 } }),
    prisma.companySegment.create({ data: { companyId: cerebrum.id, segmentId: mlopsSeg.id, marketShare: 6.8, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: tensordock.id, segmentId: gpuSeg.id, marketShare: 4.2, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: cloudscale.id, segmentId: gpuSeg.id, marketShare: 3.1, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: vectorflow.id, segmentId: vecSeg.id, marketShare: 22.4, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: vectorflow.id, segmentId: vecSeg.id, marketShare: 19.8, year: 2023 } }),
    prisma.companySegment.create({ data: { companyId: pinecrest.id, segmentId: vecSeg.id, marketShare: 31.2, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: pinecrest.id, segmentId: vecSeg.id, marketShare: 28.5, year: 2023 } }),
    prisma.companySegment.create({ data: { companyId: synthlabs.id, segmentId: llmSeg.id, marketShare: 14.6, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: anthropic.id, segmentId: llmSeg.id, marketShare: 24.8, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: anthropic.id, segmentId: llmSeg.id, marketShare: 18.3, year: 2023 } }),
    prisma.companySegment.create({ data: { companyId: querymind.id, segmentId: analyticsSeg.id, marketShare: 5.4, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: datanexus.id, segmentId: dataSeg.id, marketShare: 8.7, year: 2024 } }),
    prisma.companySegment.create({ data: { companyId: datanexus.id, segmentId: vecSeg.id, marketShare: 4.1, year: 2024 } }),
  ]);

  const productMap = new Map(products.map((p: { id: number; name: string }) => [p.name, p]));

  const pricingData: Array<{
    productName: string;
    tiers: Array<{ tier: string; monthlyPrice: number; annualPrice: number; features: string[] }>;
  }> = [
    {
      productName: "NovaTrain Pro",
      tiers: [
        { tier: "Starter", monthlyPrice: 2.49, annualPrice: 1.99, features: ["1x A100 40GB", "500GB storage", "Community support"] },
        { tier: "Pro", monthlyPrice: 3.89, annualPrice: 3.19, features: ["1x H100 80GB", "2TB storage", "Priority support", "InfiniBand"] },
        { tier: "Enterprise", monthlyPrice: 0, annualPrice: 0, features: ["Custom clusters", "Dedicated networking", "24/7 support", "SLA"] },
      ],
    },
    {
      productName: "NovaInfer",
      tiers: [
        { tier: "Pay-as-you-go", monthlyPrice: 0.0012, annualPrice: 0.001, features: ["Per-token pricing", "Auto-scaling", "Best-effort SLA"] },
        { tier: "Reserved", monthlyPrice: 899, annualPrice: 749, features: ["Dedicated endpoint", "99.99% SLA", "Model caching"] },
      ],
    },
    {
      productName: "VectorFlow DB",
      tiers: [
        { tier: "Free", monthlyPrice: 0, annualPrice: 0, features: ["100K vectors", "1 index", "Community support"] },
        { tier: "Standard", monthlyPrice: 99, annualPrice: 79, features: ["10M vectors", "10 indexes", "Email support", "Metadata filters"] },
        { tier: "Enterprise", monthlyPrice: 499, annualPrice: 399, features: ["Unlimited vectors", "Multi-tenancy", "SSO", "Dedicated cluster"] },
      ],
    },
    {
      productName: "SynthAPI",
      tiers: [
        { tier: "Developer", monthlyPrice: 0, annualPrice: 0, features: ["$10 free credits", "Rate limited", "3 models"] },
        { tier: "Team", monthlyPrice: 49, annualPrice: 39, features: ["$200 credits included", "All models", "Priority routing"] },
        { tier: "Enterprise", monthlyPrice: 299, annualPrice: 249, features: ["Volume discounts", "Custom models", "Dedicated support", "SLA"] },
      ],
    },
    {
      productName: "SynthTune",
      tiers: [
        { tier: "Starter", monthlyPrice: 149, annualPrice: 119, features: ["5 fine-tune jobs/mo", "1GB datasets", "Basic eval"] },
        { tier: "Pro", monthlyPrice: 499, annualPrice: 399, features: ["Unlimited jobs", "50GB datasets", "A/B eval", "API deploy"] },
      ],
    },
    {
      productName: "Cerebrum Marketplace",
      tiers: [
        { tier: "Pay-as-you-go", monthlyPrice: 0, annualPrice: 0, features: ["Market pricing", "Spot instances", "No commitment"] },
        { tier: "Reserved", monthlyPrice: 1999, annualPrice: 1699, features: ["Guaranteed capacity", "Fixed pricing", "Multi-region"] },
      ],
    },
    {
      productName: "PineCrest Vector",
      tiers: [
        { tier: "Free", monthlyPrice: 0, annualPrice: 0, features: ["100K vectors", "5 namespaces", "Community forum"] },
        { tier: "Standard", monthlyPrice: 79, annualPrice: 65, features: ["5M vectors", "100 namespaces", "Hybrid search", "Email support"] },
        { tier: "Enterprise", monthlyPrice: 399, annualPrice: 329, features: ["Unlimited", "Dedicated pods", "SSO", "Premium support"] },
      ],
    },
    {
      productName: "Claude Enterprise",
      tiers: [
        { tier: "Team", monthlyPrice: 30, annualPrice: 25, features: ["Per-seat pricing", "200K context", "Admin console"] },
        { tier: "Enterprise", monthlyPrice: 0, annualPrice: 0, features: ["Custom pricing", "Custom context", "SSO/SCIM", "Audit logs"] },
      ],
    },
    {
      productName: "TensorDock Compute",
      tiers: [
        { tier: "Spot", monthlyPrice: 0.2, annualPrice: 0.15, features: ["Preemptible", "A100/A6000", "Hourly billing"] },
        { tier: "On-Demand", monthlyPrice: 0.89, annualPrice: 0.69, features: ["Guaranteed uptime", "All GPUs", "Docker support"] },
        { tier: "Reserved", monthlyPrice: 599, annualPrice: 499, features: ["Dedicated hardware", "SLA", "Priority support"] },
      ],
    },
    {
      productName: "QueryMind Analytics",
      tiers: [
        { tier: "Free", monthlyPrice: 0, annualPrice: 0, features: ["100 queries/mo", "3 data sources", "Community"] },
        { tier: "Pro", monthlyPrice: 79, annualPrice: 65, features: ["Unlimited queries", "10 data sources", "Dashboards", "Email support"] },
        { tier: "Enterprise", monthlyPrice: 299, annualPrice: 249, features: ["Unlimited everything", "SSO", "Audit logs", "Custom models"] },
      ],
    },
    {
      productName: "DataNexus Lakehouse",
      tiers: [
        { tier: "Standard", monthlyPrice: 199, annualPrice: 159, features: ["10TB storage", "SQL analytics", "5 users"] },
        { tier: "Premium", monthlyPrice: 799, annualPrice: 649, features: ["100TB storage", "Streaming + vector search", "Unlimited users", "SLA"] },
      ],
    },
    {
      productName: "CloudScale Inference",
      tiers: [
        { tier: "Starter", monthlyPrice: 149, annualPrice: 119, features: ["1 edge node", "100K requests/mo", "Best-effort latency"] },
        { tier: "Pro", monthlyPrice: 599, annualPrice: 499, features: ["5 edge nodes", "1M requests/mo", "Sub-50ms SLA", "gRPC"] },
      ],
    },
  ];

  for (const { productName, tiers } of pricingData) {
    const product = productMap.get(productName) as { id: number; name: string } | undefined;
    if (!product) continue;
    for (const t of tiers) {
      await prisma.pricing.create({
        data: {
          productId: product.id,
          tier: t.tier,
          monthlyPrice: t.monthlyPrice,
          annualPrice: t.annualPrice,
          features: t.features,
        },
      });
    }
  }

  const reviewSources = ["G2", "TrustRadius", "Gartner Peer Insights", "ProductHunt", "TechCrunch Review"];

  const reviewData: Array<{
    productName: string;
    reviews: Array<{ source: string; rating: number; summary: string; pros: string; cons: string; date: string }>;
  }> = [
    {
      productName: "NovaTrain Pro",
      reviews: [
        { source: reviewSources[0], rating: 4.6, summary: "Best-in-class GPU cloud for serious ML training. InfiniBand makes multi-node feel seamless.", pros: "Fast GPUs, reliable networking, great docs", cons: "Expensive at scale, limited regions", date: "2024-06-15" },
        { source: reviewSources[2], rating: 4.3, summary: "Solid H100 availability and competitive pricing for reserved instances.", pros: "H100 availability, flexible pricing", cons: "UI could be more intuitive, slow support for non-enterprise", date: "2024-03-22" },
      ],
    },
    {
      productName: "VectorFlow DB",
      reviews: [
        { source: reviewSources[0], rating: 4.5, summary: "The developer experience is excellent. HNSW indexing is fast and metadata filters are powerful.", pros: "Great DX, fast queries, good docs", cons: "Gets pricey at large scale, no serverless option", date: "2024-08-10" },
        { source: reviewSources[1], rating: 4.2, summary: "Reliable vector database with strong multi-tenancy support for our SaaS product.", pros: "Multi-tenancy, gRPC support, stable", cons: "Missing sparse vector support, needs more connectors", date: "2024-05-18" },
        { source: reviewSources[3], rating: 4.7, summary: "Migrated from Elasticsearch to VectorFlow -- 10x faster similarity search.", pros: "Performance, ease of migration, API simplicity", cons: "Smaller community than alternatives", date: "2024-01-30" },
      ],
    },
    {
      productName: "SynthAPI",
      reviews: [
        { source: reviewSources[0], rating: 4.4, summary: "Single API for all major LLMs. Prompt caching saves us 40% on token costs.", pros: "Multi-model, cost savings, good analytics", cons: "Occasional latency spikes, limited fine-tuning options", date: "2024-07-05" },
        { source: reviewSources[4], rating: 4.1, summary: "Great concept but still maturing. Router needs better model selection logic.", pros: "Unified API, good documentation", cons: "Model routing not always optimal, enterprise features still in beta", date: "2024-04-12" },
      ],
    },
    {
      productName: "PineCrest Vector",
      reviews: [
        { source: reviewSources[0], rating: 4.8, summary: "The serverless experience is unmatched. Zero ops, just upload vectors and query.", pros: "True serverless, hybrid search, fast", cons: "Vendor lock-in risk, limited self-hosting options", date: "2024-09-01" },
        { source: reviewSources[2], rating: 4.5, summary: "PineCrest is the gold standard for managed vector databases. Worth the premium.", pros: "Reliability, ease of use, namespace isolation", cons: "Premium pricing, needs better bulk import tools", date: "2024-06-20" },
        { source: reviewSources[1], rating: 4.3, summary: "Solid product. Hybrid search with sparse-dense vectors is a game changer for our RAG pipeline.", pros: "Hybrid search, low latency, good SDKs", cons: "Debugging tools could be better, pricing not transparent", date: "2024-02-14" },
      ],
    },
    {
      productName: "Claude Enterprise",
      reviews: [
        { source: reviewSources[0], rating: 4.7, summary: "Best LLM for complex reasoning tasks. 200K context window is a game changer.", pros: "Reasoning quality, long context, safety features", cons: "Slower than some competitors, limited multimodal", date: "2024-08-25" },
        { source: reviewSources[2], rating: 4.4, summary: "Enterprise SSO and audit logs make compliance easy. The model quality is top-tier.", pros: "Enterprise features, model quality, API stability", cons: "Pricing higher than OpenAI for high volume, rate limits", date: "2024-05-10" },
      ],
    },
    {
      productName: "TensorDock Compute",
      reviews: [
        { source: reviewSources[3], rating: 4.1, summary: "Cheapest A100 instances we could find. Perfect for research labs on a budget.", pros: "Low pricing, GPU variety, fast provisioning", cons: "Occasional availability issues, basic monitoring", date: "2024-07-28" },
        { source: reviewSources[0], rating: 3.8, summary: "Good value but you get what you pay for. Support is minimal.", pros: "Price, hourly billing, Docker support", cons: "Limited support, no SLA on spot, basic dashboard", date: "2024-04-05" },
      ],
    },
    {
      productName: "Cerebrum Marketplace",
      reviews: [
        { source: reviewSources[1], rating: 4.3, summary: "The marketplace model is clever -- we always find the best price across clouds.", pros: "Price comparison, multi-cloud, Kubernetes", cons: "Added abstraction layer, debugging cross-cloud issues", date: "2024-06-12" },
      ],
    },
    {
      productName: "QueryMind Analytics",
      reviews: [
        { source: reviewSources[0], rating: 4.2, summary: "Our business analysts love it. They write English, get SQL and charts.", pros: "NL-to-SQL accuracy, dashboard builder, easy onboarding", cons: "Complex joins sometimes fail, limited custom viz", date: "2024-08-02" },
        { source: reviewSources[3], rating: 4.5, summary: "Revolutionary for data democratization. Non-technical teams are now self-sufficient.", pros: "Accessibility, scheduled reports, data source connectors", cons: "Needs more enterprise controls, SSO still in beta", date: "2024-03-15" },
      ],
    },
    {
      productName: "DataNexus Lakehouse",
      reviews: [
        { source: reviewSources[2], rating: 4.4, summary: "Finally a platform that does SQL, streaming, AND vector search without three different systems.", pros: "Unified platform, Delta Lake, vector search", cons: "Steep learning curve, expensive at scale", date: "2024-07-20" },
        { source: reviewSources[0], rating: 4.0, summary: "Powerful but complex. Took 3 months to fully migrate from our legacy data warehouse.", pros: "Feature-rich, good performance, active community", cons: "Complex setup, documentation gaps, migration tools need work", date: "2024-01-08" },
      ],
    },
    {
      productName: "CloudScale Inference",
      reviews: [
        { source: reviewSources[1], rating: 4.0, summary: "Great for APAC latency requirements. Edge nodes make a real difference.", pros: "Low latency, APAC coverage, TensorRT", cons: "Limited to inference, smaller GPU selection, young platform", date: "2024-09-10" },
      ],
    },
  ];

  for (const { productName, reviews } of reviewData) {
    const product = productMap.get(productName) as { id: number; name: string } | undefined;
    if (!product) continue;
    for (const r of reviews) {
      await prisma.review.create({
        data: {
          productId: product.id,
          source: r.source,
          rating: r.rating,
          summary: r.summary,
          pros: r.pros,
          cons: r.cons,
          date: new Date(r.date),
        },
      });
    }
  }

  console.log("Seed complete:");
  console.log(`  ${companies.length} companies`);
  console.log(`  ${products.length} products`);
  console.log(`  ${pricingData.reduce((s: number, p: { tiers: unknown[] }) => s + p.tiers.length, 0)} pricing tiers`);
  console.log(`  ${segments.length} market segments`);
  console.log(`  17 company-segment mappings`);
  console.log(`  ${reviewData.reduce((s, p) => s + p.reviews.length, 0)} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
