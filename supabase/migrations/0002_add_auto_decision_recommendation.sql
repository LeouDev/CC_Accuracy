-- Store AutoDecisionRecommendation as its own literal field, separate from
-- auto_insight_decision, since the accuracy scoring rule now compares
-- Clinical against AutoDecisionRecommendation specifically (not AutoInsightDecision).
alter table raw_data add column if not exists auto_decision_recommendation text;
