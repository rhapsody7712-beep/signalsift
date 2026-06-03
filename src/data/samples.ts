/**
 * Five contrasting sample candidates for one role — Senior Platform / SRE Engineer.
 * Used for the Phase 0 demo; no real candidate data, fully synthetic.
 *
 * Profiles:
 *   alice-chen      — Evidence-heavy ideal candidate (all criteria met, quantified)
 *   brandon-kim     — AI / buzzword template (keywords present, no evidence, misses on-call)
 *   carlos-m        — Vague / thin (meets kubernetes, misses two deal-breakers)
 *   diana-warren    — Strong but has impossible overlapping date ranges
 *   ethan-rodriguez — Strong across the board but zero Kubernetes → hard-gate disqualified
 */

import type {
  Candidate,
  ManagerCriteria,
  OrgCriteria,
  RecruiterCriteria,
} from "../engine/types";

// ─── Role criteria ────────────────────────────────────────────────────────────

export const SAMPLE_MANAGER_CRITERIA: ManagerCriteria = {
  roleId: "senior-platform-sre",
  criteria: [
    {
      id: "db_kube",
      label: "Kubernetes / container orchestration",
      tier: "deal_breaker",
      dealBreakerBehavior: "hard_gate",
      keywords: ["kubernetes", "k8s"],
      description: "Must have hands-on production Kubernetes experience.",
    },
    {
      id: "db_lang",
      label: "Python or Go programming",
      tier: "deal_breaker",
      dealBreakerBehavior: "strong_penalty",
      keywords: ["python", "golang"],
      description: "Primary languages for infra automation and tooling.",
    },
    {
      id: "db_oncall",
      label: "Production on-call / incident response",
      tier: "deal_breaker",
      dealBreakerBehavior: "strong_penalty",
      keywords: ["on-call", "incident", "pagerduty"],
      description: "Must have owned an on-call rotation for production services.",
    },
    {
      id: "m_cicd",
      label: "CI/CD pipeline experience",
      tier: "medium",
      keywords: ["ci/cd", "github actions", "jenkins"],
      description: "GitHub Actions, Jenkins, or equivalent.",
    },
    {
      id: "m_cloud",
      label: "Cloud infrastructure (AWS / GCP / Azure)",
      tier: "medium",
      keywords: ["aws", "gcp", "azure"],
      description: "Hands-on cloud infra provisioning and management.",
    },
    {
      id: "p_oss",
      label: "Open-source contributions",
      tier: "preferred",
      keywords: ["open source", "open-source"],
      description: "Public contributions to OSS projects.",
    },
  ],
};

export const SAMPLE_RECRUITER_CRITERIA: RecruiterCriteria = {
  criteria: [
    {
      id: "rc_auth",
      label: "Eligible to work in the US without sponsorship",
      tier: "medium",
      kind: "work_auth",
      location: "United States",
      enabled: true,
      keywords: ["authorized", "citizen", "permanent resident"],
    },
    {
      id: "rc_loc",
      label: "Remote US or Seattle metro",
      tier: "preferred",
      kind: "location",
      targetRegion: "Remote US or Seattle metro",
      enabled: true,
      keywords: ["remote", "seattle", "us-based"],
    },
  ],
};

export const SAMPLE_ORG_CRITERIA: OrgCriteria = {
  organizationId: "acme-corp",
  criteria: [],
};

// ─── Candidate 1: Evidence-heavy ──────────────────────────────────────────────
// All criteria met. Dense quantified evidence. No template prose. No AI signal.

export const ALICE_CHEN: Candidate = {
  id: "alice-chen",
  name: "Alice Chen",
  source: "sample",
  resumeText: `
Alice Chen | alice.chen@email.com | Seattle, WA
US citizen — authorized to work in the United States without sponsorship.
Seattle-based, us-based, remote-eligible.

SUMMARY
Staff Platform Engineer with 9 years building and operating large-scale distributed
systems. Kubernetes specialist. On-call veteran. Open-source maintainer.

EXPERIENCE

Staff Platform Engineer — Acme Cloud  (2020 – present)
• Designed and operated a 1,400-node Kubernetes (k8s) cluster serving 45M requests/day;
  reduced p99 latency from 420 ms to 180 ms — a 57% improvement over 8 months.
• Led on-call rotation for 6 production services; reduced MTTR from 45 min to 11 min
  by automating incident runbooks in Python; resolved 300+ incidents over 4 years.
• Owned CI/CD pipelines via GitHub Actions; cut release cycle from 14 days to 2 days
  and reduced failed deployments by 82%.
• Managed AWS infrastructure (EC2, EKS, RDS, S3) for a $6M/year platform;
  saved $1.2M annually through reserved-instance right-sizing.
• Rebuilt PagerDuty escalation policy; reduced false-positive alert rate by 73%,
  reclaiming ~8 hours/week of on-call engineer time.

Senior SRE — DataFlow Inc  (2016 – 2020)
• Scaled Kubernetes cluster from 50 to 400 nodes to support 5x traffic growth;
  zero P1 incidents across 72-hour Black Friday peak window.
• Rewrote deployment tooling in Golang; reduced build times by 68% and eliminated
  3 categories of deploy-time incidents.
• Maintained 99.97% SLA across 12 services; on-call responder for 200+ incidents/year,
  average resolution time under 20 minutes.
• Migrated 40 on-premise workloads to GCP; cut infrastructure cost by $800k/year (34%).

OPEN SOURCE
• Maintainer of k8s-autoscaler-patch: 1,400 GitHub stars, 80 contributors.
  An open-source Kubernetes HPA extension with custom metric support.
• Open-source contributor to Prometheus; 3 merged PRs improving alert routing.

EDUCATION
B.S. Computer Science, University of Washington, 2015

SKILLS
Python, Golang, Kubernetes, k8s, AWS, GCP, GitHub Actions, CI/CD, PagerDuty,
Terraform, Prometheus, Grafana, on-call, incident response
`.trim(),
};

// ─── Candidate 2: AI / buzzword template ─────────────────────────────────────
// Has Kubernetes, Python, CI/CD, cloud keywords. Zero quantified evidence.
// Loaded with template phrases. Missing on-call / incident / PagerDuty entirely.

export const BRANDON_KIM: Candidate = {
  id: "brandon-kim",
  name: "Brandon Kim",
  source: "sample",
  resumeText: `
Brandon Kim | brandon.kim@email.com | Remote
Authorized to work in the United States. US-based, remote.

SUMMARY
Results-driven platform engineer with a proven track record of delivering innovative solutions.
Detail-oriented team player passionate about leveraging cutting-edge technology to drive synergy
across cross-functional teams. Highly motivated self-starter with excellent communication skills
and a strong commitment to continuous improvement. Seeking a challenging opportunity to make
a meaningful impact on a world-class engineering organization.

EXPERIENCE

Senior Platform Engineer — TechCorp  (2020 – present)
Responsible for driving platform strategy and leveraging Kubernetes to deliver scalable
infrastructure solutions. Assisted in maintaining CI/CD pipelines using GitHub Actions and
Jenkins to support team delivery objectives. Worked on various AWS and Azure cloud projects
to support business needs. Utilized Python for scripting and automation tasks. Detail-oriented
approach to all deliverables ensured quality outcomes. Helped with improving team workflows
and driving results across multiple work streams.

Platform Engineer — InnovateCo  (2017 – 2020)
Responsible for Kubernetes (k8s) cluster management and worked on various pipeline tasks.
Leveraged AWS cloud services to support business goals. Duties included monitoring and
reporting on system health metrics. Worked on various team initiatives to drive innovation
and synergy. Strong communication skills enabled effective collaboration with cross-functional
stakeholders. Assisted in deploying Python automation scripts to streamline processes.

SKILLS
Kubernetes, k8s, Python, AWS, Azure, CI/CD, GitHub Actions, Jenkins, Cloud Infrastructure,
Team Player, Strong Communication, Detail-Oriented, Results-Driven, Fast Learner, Self-Starter

EDUCATION
B.S. Information Technology, State University, 2017
`.trim(),
};

// ─── Candidate 3: Vague / thin ────────────────────────────────────────────────
// Short, generic resume. Mentions Kubernetes (basic) — avoids hard-gate disqualification.
// No Python/Go → strong_penalty. No on-call/incident → strong_penalty.
// Misses CI/CD, cloud, open source, work auth, location.

export const CARLOS_M: Candidate = {
  id: "carlos-m",
  name: "Carlos M.",
  source: "sample",
  resumeText: `
Carlos M. | carlos.m@email.com

EXPERIENCE

IT Support and Infrastructure  (2021 – present)
I work with technology platforms and help teams solve problems. I have taken online courses
on containerization and have basic exposure to Kubernetes. I am a quick learner who adapts
to new tools rapidly. I enjoy working with computers and helping my team succeed.

Junior Systems Administrator — Regional Business  (2018 – 2021)
Helped maintain servers and network equipment. Assisted with software upgrades and end-user
support. Worked with the team to keep systems running. Good at troubleshooting issues.

EDUCATION
Associate Degree in Computer Science, Community College, 2018

SKILLS
Networking, Kubernetes (beginner), Computers, Technology, Team Work, Quick Learner
`.trim(),
};

// ─── Candidate 4: Consistency problem ────────────────────────────────────────
// Strong candidate, all criteria met, good quantified evidence.
// Three jobs with impossible overlapping date ranges — flags for human review.
//   CloudBase  2017 – 2022
//   Freelance  2019 – 2021   ← overlaps with CloudBase (2019–2021)
//   Momentum   2020 – present ← overlaps with both above

export const DIANA_WARREN: Candidate = {
  id: "diana-warren",
  name: "Diana Warren",
  source: "sample",
  resumeText: `
Diana Warren | diana.warren@email.com | Seattle, WA
US citizen — authorized to work without sponsorship. Seattle-based, remote-eligible.

SUMMARY
Senior SRE with 8 years of platform engineering experience. Kubernetes advocate.
On-call veteran and incident commander. Open-source contributor.

EXPERIENCE

Senior Platform Engineer — CloudBase Inc  (2017 – 2022)
• Managed Kubernetes (k8s) clusters across 3 regions; reduced cluster provisioning
  time from 2 hours to 8 minutes using Terraform and Python automation.
• Built CI/CD pipelines with GitHub Actions; improved deployment frequency by 4x
  and reduced rollback rate from 18% to 3%.
• Owned on-call rotation; responded to 150+ incidents/year; drove MTTR down by 35%.
• Administered AWS (EC2, S3, RDS) and GCP infrastructure; cut monthly spend by $45k.
• PagerDuty integration owner; tuned 200+ alert rules, reducing noise by 60%.

SRE Consultant — FreelanceOps  (2019 – 2021)
• Advised 4 startups on Kubernetes migration strategy; each reduced infra cost by 20–35%.
• Wrote Python tooling for automated incident triage; saved clients ~5 hours/week each.
• Built GitHub Actions CI/CD pipelines for 3 clients on AWS; reduced deploy times by 50%.
• Golang microservice to consolidate on-call alerting across PagerDuty and OpsGenie.

Senior SRE — Momentum Tech  (2020 – present)
• Led Kubernetes migration for 30 microservices; reduced infrastructure cost by $300k/year.
• Rewrote internal deployment tooling in Golang; reduced deploy errors by 55%.
• Managed incident response and on-call escalation for 8 production services on GCP.
• Published k8s-policy-enforcer (open-source, 300 GitHub stars); open source maintainer
  for a Prometheus alerting library used by 15 companies.

EDUCATION
B.S. Computer Science, UC Berkeley, 2016

SKILLS
Python, Golang, Kubernetes, k8s, AWS, GCP, GitHub Actions, CI/CD, PagerDuty,
on-call, incident response, open-source, open source, Terraform, Prometheus, Seattle
`.trim(),
};

// ─── Candidate 5: Strong but fails the hard-gate deal-breaker ─────────────────
// Excellent evidence, meets Python/Go, on-call, CI/CD, cloud, open source.
// Zero mention of Kubernetes or k8s → hard-gate → DISQUALIFIED.

export const ETHAN_RODRIGUEZ: Candidate = {
  id: "ethan-rodriguez",
  name: "Ethan Rodriguez",
  source: "sample",
  resumeText: `
Ethan Rodriguez | ethan.r@email.com | San Francisco, CA
Authorized to work in the United States without sponsorship. us-based, remote.

SUMMARY
Senior Infrastructure Engineer with 9 years building and operating high-scale distributed
systems. Expert in Python and Golang automation, cloud infrastructure, and production
incident management. Strong on-call background with a record of dramatically reducing MTTR.

EXPERIENCE

Senior Infrastructure Engineer — ScaleUp Corp  (2020 – present)
• Automated AWS infrastructure for a platform handling 20M requests/day using Terraform
  and Python; reduced provisioning time from 4 hours to 18 minutes (75% improvement).
• Built CI/CD pipelines with GitHub Actions and Jenkins; reduced release cycle from
  10 days to 18 hours and cut deployment failures by 65%.
• Owned on-call rotation for 8 production services; resolved 400+ incidents over 4 years;
  drove MTTR from 60 min to 14 min using automated Python runbooks.
• PagerDuty champion: rebuilt alerting stack from scratch; reduced false-positive alert
  rate by 80% and saved on-call engineers 10 hours/week of interrupt time.
• Grew infrastructure team from 3 to 11 engineers; managed $4M annual cloud budget;
  negotiated reserved-instance contracts saving $900k/year.

Infrastructure Engineer — DataServe Inc  (2016 – 2020)
• Managed GCP and Azure infrastructure for 5 business units; reduced cloud spend by
  $600k/year through rightsizing and committed-use discounts.
• Wrote Golang services replacing 4 legacy bash scripts; cut maintenance time by 70%
  and eliminated an entire class of operational incidents.
• Maintained 99.95% SLA across 9 services; served as primary on-call responder for 3 years.
• Built and maintained Jenkins CI/CD pipelines for 20 services; zero downtime releases.

OPEN SOURCE
• Maintainer of infra-toolkit (open-source): 900 GitHub stars, used at 40+ companies.
  An open-source Golang library for AWS infrastructure pattern automation.
• Open-source contributor to Terraform provider for custom cloud resources; 5 merged PRs.

EDUCATION
B.S. Computer Science, Stanford University, 2015

SKILLS
Python, Golang, AWS, GCP, Azure, GitHub Actions, Jenkins, CI/CD, PagerDuty,
Terraform, Prometheus, on-call, incident response, open-source, open source
`.trim(),
};

// ─── Exported collection ──────────────────────────────────────────────────────

export const SAMPLE_CANDIDATES: Candidate[] = [
  ALICE_CHEN,
  BRANDON_KIM,
  CARLOS_M,
  DIANA_WARREN,
  ETHAN_RODRIGUEZ,
];
