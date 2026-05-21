begin;

-- Preview rows likely to be changed in scraped_jobs.
select id, title
from scraped_jobs
where title ~* '^\s*(\[external\s+from\s+[^\]]+\]:|external\s+from\s+[^:]+:|static\s*[/:]+)'
order by created_at desc
limit 50;

with cleaned as (
  select
    id,
    title,
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(title, '^\s*\[external\s+from\s+[^\]]+\]:\s*', '', 'i'),
          '^\s*external\s+from\s+[^:]+:\s*',
          '',
          'i'
        ),
        '^\s*static\s*[/:]+\s*',
        '',
        'i'
      )
    ) as normalized_title
  from scraped_jobs
),
updated as (
  update scraped_jobs s
  set title = c.normalized_title
  from cleaned c
  where s.id = c.id
    and c.normalized_title <> ''
    and c.normalized_title <> c.title
  returning s.id
)
select count(*) as scraped_jobs_rows_updated from updated;

with cleaned as (
  select
    id,
    title,
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(title, '^\s*\[external\s+from\s+[^\]]+\]:\s*', '', 'i'),
          '^\s*external\s+from\s+[^:]+:\s*',
          '',
          'i'
        ),
        '^\s*static\s*[/:]+\s*',
        '',
        'i'
      )
    ) as normalized_title
  from shared_jobs
),
updated as (
  update shared_jobs s
  set title = c.normalized_title,
      updated_at = now()
  from cleaned c
  where s.id = c.id
    and c.normalized_title <> ''
    and c.normalized_title <> c.title
  returning s.id
)
select count(*) as shared_jobs_rows_updated from updated;

commit;
