insert into public.verses (id, reference, translation, parts, answers, decoys, theme_id)
values
  ('rom323', 'Romans 3:23', 'NIV', array['For all have ', ' and fall ', ' of the glory of God.'], array['SINNED', 'SHORT'], array['FAILED', 'AWAY', 'FAR'], 'core'),
  ('jn316', 'John 3:16', 'NIV', array['For God so ', ' the world that he ', ' his one and only ', ', that whoever ', ' in him shall not perish but have eternal life.'], array['LOVED', 'GAVE', 'SON', 'BELIEVES'], array['SENT', 'CHILD', 'TRUSTS', 'SAVED'], 'core'),
  ('ps4610', 'Psalm 46:10', 'NIV', array['Be ', ' and know that I am God. I will be ', ' among the nations, I will be exalted in the earth.'], array['STILL', 'EXALTED'], array['QUIET', 'CALM', 'PRAISED'], 'core')
on conflict (id) do nothing;
