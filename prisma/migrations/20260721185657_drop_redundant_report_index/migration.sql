-- `Report_userId_targetYear_targetMonth_key` (created by the @@unique on the
-- same three columns) already provides an equivalent index, making this
-- plain index redundant.
DROP INDEX "Report_userId_targetYear_targetMonth_idx";
