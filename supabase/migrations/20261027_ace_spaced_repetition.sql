create table public.ace_review_cards(user_id uuid not null references auth.users(id) on delete cascade,question_id uuid not null references public.ace_questions(id) on delete cascade,due_at timestamptz not null default now(),interval_days integer not null default 0 check(interval_days between 0 and 365),correct_streak smallint not null default 0 check(correct_streak between 0 and 100),last_reviewed_at timestamptz,primary key(user_id,question_id));
alter table public.ace_review_cards enable row level security;
revoke all on public.ace_review_cards from public,anon,authenticated;
create policy ace_review_cards_self on public.ace_review_cards for select to authenticated using(user_id=(select auth.uid()));
grant select on public.ace_review_cards to authenticated;
create function public.ace_auto_review_cards() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ace_review_cards(user_id,question_id)
 select new.user_id,q.id from public.ace_questions q where q.quiz_id=new.quiz_id and coalesce(new.answers->>q.id::text,'-1')<>q.correct_index::text
 on conflict(user_id,question_id) do nothing;
 return new;
end $$;
revoke all on function public.ace_auto_review_cards() from public,anon,authenticated;
create trigger ace_review_after_attempt after insert on public.ace_quiz_attempts for each row execute function public.ace_auto_review_cards();
create function public.ace_due_review_cards() returns table(question_id uuid,prompt text,correct_answer text,explanation text,due_at timestamptz,interval_days integer)
language sql stable security definer set search_path='' as $$
select c.question_id,q.prompt,q.options->>q.correct_index,q.explanation,c.due_at,c.interval_days from public.ace_review_cards c join public.ace_questions q on q.id=c.question_id
where c.user_id=auth.uid() and auth.uid() is not null and c.due_at<=now() order by c.due_at limit 40 $$;
revoke all on function public.ace_due_review_cards() from public,anon;grant execute on function public.ace_due_review_cards() to authenticated;
create function public.ace_rate_review_card(p_question uuid,p_rating smallint) returns timestamptz language plpgsql security definer set search_path='' as $$
declare v_due timestamptz;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_rating not in (0,1,2) then raise exception 'Invalid review rating';end if;
 update public.ace_review_cards set interval_days=case when p_rating=0 then 0 when p_rating=1 then greatest(1,least(14,interval_days*2)) else greatest(3,least(30,interval_days*3)) end,
 correct_streak=case when p_rating=0 then 0 else least(100,correct_streak+1) end,
 last_reviewed_at=now(),due_at=now()+case when p_rating=0 then interval '10 minutes' when p_rating=1 then make_interval(days=>greatest(1,least(14,interval_days*2))) else make_interval(days=>greatest(3,least(30,interval_days*3))) end
 where user_id=auth.uid() and question_id=p_question and due_at<=now()
 returning due_at into v_due;
 if v_due is null then raise exception 'Card not due or unavailable';end if;
 return v_due;
end $$;
revoke all on function public.ace_rate_review_card(uuid,smallint) from public,anon;
grant execute on function public.ace_rate_review_card(uuid,smallint) to authenticated;