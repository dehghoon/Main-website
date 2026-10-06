-- Explicitly block direct authenticated table mutations.
-- All structural labeling writes must pass through the controlled SECURITY DEFINER RPC/domain functions.
revoke insert, update, delete on public.structural_labeling_candidates from authenticated;
