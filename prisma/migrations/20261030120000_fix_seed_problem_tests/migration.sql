-- Three seeded coding problems failed their own tests in every kit, for candidates too (AIIN-107).
-- A single array argument is now written wrapped, and a linked list as {"list": [...]} (lib/problems/run-js.ts).
-- Only rows still holding the original seed tests change, so an admin's edits are kept.

UPDATE "CompanyQuestion" SET "testCases" = '[{"input": "{\"list\":[1,2,3,4,5]}", "expected": "[5,4,3,2,1]"}, {"input": "{\"list\":[1,2]}", "expected": "[2,1]"}, {"input": "{\"list\":[]}", "expected": "[]"}]'::jsonb, "checkedHash" = NULL
WHERE "question" = 'Reverse a linked list' AND "testCases" = '[{"input": "[1,2,3,4,5]", "expected": "[5,4,3,2,1]"}, {"input": "[1,2]", "expected": "[2,1]"}, {"input": "[]", "expected": "[]"}]'::jsonb;

UPDATE "CompanyQuestion" SET "testCases" = '[{"input": "[[\"flower\",\"flow\",\"flight\"]]", "expected": "\"fl\""}, {"input": "[[\"dog\",\"racecar\",\"car\"]]", "expected": "\"\""}]'::jsonb, "checkedHash" = NULL
WHERE "question" = 'Find the longest common prefix among an array of strings' AND "testCases" = '[{"input": "[\"flower\",\"flow\",\"flight\"]", "expected": "\"fl\""}, {"input": "[\"dog\",\"racecar\",\"car\"]", "expected": "\"\""}]'::jsonb;

UPDATE "CompanyQuestion" SET "testCases" = '[{"input": "[[-2,1,-3,4,-1,2,1,-5,4]]", "expected": "6"}, {"input": "[[1]]", "expected": "1"}, {"input": "[[5,4,-1,7,8]]", "expected": "23"}]'::jsonb, "checkedHash" = NULL
WHERE "question" = 'Maximum Subarray Sum (Kadane''s Algorithm)' AND "testCases" = '[{"input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6"}, {"input": "[1]", "expected": "1"}, {"input": "[5,4,-1,7,8]", "expected": "23"}]'::jsonb;
