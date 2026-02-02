-- 2026 NFL Draft Prospects (Top 30) - Based on Mel Kiper's Big Board Jan 2026

INSERT INTO players (name, slug, position, school, height, weight, rank, projected_round, consensus_grade) VALUES
('Fernando Mendoza', 'fernando-mendoza', 'QB', 'Indiana', '6-5', '225', 1, '1', 97.0),
('Jeremiyah Love', 'jeremiyah-love', 'RB', 'Notre Dame', '6-0', '214', 2, '1', 97.0),
('Carnell Tate', 'carnell-tate', 'WR', 'Ohio State', '6-3', '195', 3, '1', 93.0),
('Arvell Reese', 'arvell-reese', 'LB', 'Ohio State', '6-4', '243', 4, '1', 93.0),
('David Bailey', 'david-bailey', 'EDGE', 'Texas Tech', '6-3', '250', 5, '1', 93.0),
('Caleb Downs', 'caleb-downs', 'S', 'Ohio State', '6-0', '205', 6, '1', 93.0),
('Rueben Bain Jr.', 'rueben-bain-jr', 'DL', 'Miami', '6-3', '275', 7, '1', 90.0),
('Francis Mauigoa', 'francis-mauigoa', 'OT', 'Miami', '6-6', '315', 8, '1', 90.0),
('Jihaad Campbell', 'jihaad-campbell', 'LB', 'Alabama', '6-3', '240', 9, '1', 90.0),
('Malachi Moore', 'malachi-moore', 'S', 'Alabama', '6-0', '205', 10, '1', 90.0),
('Tyler Warren', 'tyler-warren', 'TE', 'Penn State', '6-6', '255', 11, '1-2', 87.0),
('Donovan Ezeiruaku', 'donovan-ezeiruaku', 'EDGE', 'BC', '6-3', '250', 12, '1-2', 87.0),
('Jalon Walker', 'jalon-walker', 'LB', 'Georgia', '6-2', '245', 13, '1-2', 87.0),
('Ashton Jeanty', 'ashton-jeanty', 'RB', 'Boise State', '5-9', '215', 14, '2', 87.0),
('Emery Jones Jr.', 'emery-jones-jr', 'OT', 'LSU', '6-7', '310', 15, '1-2', 83.0),
('Jordan Burch', 'jordan-burch', 'DL', 'Oregon', '6-4', '295', 16, '1-2', 83.0),
('Xavier Watts', 'xavier-watts', 'S', 'Notre Dame', '6-0', '202', 17, '1-2', 83.0),
('Colston Loveland', 'colston-loveland', 'TE', 'Michigan', '6-5', '245', 18, '1-2', 83.0),
('Shemar Stewart', 'shemar-stewart', 'DL', 'Texas A&M', '6-5', '290', 19, '2', 83.0),
('Kelvin Banks Jr.', 'kelvin-banks-jr', 'OT', 'Texas', '6-4', '320', 20, '1-2', 83.0),
('Elic Ayomanor', 'elic-ayomanor', 'WR', 'Stanford', '6-2', '215', 21, '2', 83.0),
('Princely Umanmielen', 'princely-umanmielen', 'EDGE', 'Ole Miss', '6-4', '265', 22, '2', 83.0),
('Shavon Revel', 'shavon-revel', 'CB', 'East Carolina', '6-1', '190', 23, '2', 83.0),
('Mykel Williams', 'mykel-williams', 'DL', 'Georgia', '6-5', '265', 24, '2', 80.0),
('Tre Harris', 'tre-harris', 'WR', 'Ole Miss', '6-3', '205', 25, '2-3', 80.0),
('Tyleik Williams', 'tyleik-williams', 'DL', 'Ohio State', '6-3', '330', 26, '2', 80.0),
('Nick Emmanwori', 'nick-emmanwori', 'S', 'South Carolina', '6-3', '225', 27, '2', 80.0),
('Deone Walker', 'deone-walker', 'DL', 'Kentucky', '6-6', '345', 28, '2', 80.0),
('Mikail Kamara', 'mikail-kamara', 'EDGE', 'Indiana', '6-3', '260', 29, '2-3', 80.0),
('James Pearce Jr.', 'james-pearce-jr', 'EDGE', 'Tennessee', '6-5', '240', 30, '2-3', 80.0);

-- Expert Reports for Top 10 Players
INSERT INTO expert_reports (player_id, summary, strengths, weaknesses, scheme_fit, nfl_comp, floor, ceiling, risk) VALUES
(1, 'Mendoza transferred to Indiana after playing two seasons at Cal, and his game took off. Cut down on sacks dramatically, got the ball out quicker. Fantastic ball placement with enough mobility to pick up first downs as a scrambler.', 'Elite ball placement, quick release, improved decision-making, reduced sack rate from 41 to 25, mobile enough to scramble', 'Doesn''t have a huge arm, not a true dual-threat QB', 'Perfect for timing-based West Coast or Air Raid systems that value accuracy and quick decision-making', 'Andy Dalton with better mobility', 'Solid NFL starter (Andy Dalton range)', 'Franchise QB if arm strength improves', 'Low - proven production, leadership, and steady improvement trajectory'),

(2, 'Reminds scouts of Reggie Bush. Vision and burst between the tackles and to the outside, breaks tackles with ease (60 forced missed tackles), breakaway speed. Outstanding pass catcher who can flank out wide.', 'Elite vision, burst, breakaway speed, pass-catching ability, forces missed tackles, versatile', 'Durability concerns at 214 lbs, needs to prove he can handle NFL workload', 'Perfect for modern NFL offenses that use RBs as receivers - Saints, 49ers, Rams schemes', 'Reggie Bush', 'High-end RB2 / change-of-pace back', 'All-Pro dual-threat RB', 'Medium - size concerns, but elite talent'),

(3, 'Ohio State WR U continues. Precise route runner with great hands and outstanding body control. Averaged 17.2 yards per catch, produces big plays regularly, willing blocker.', 'Precise routes, great hands, body control, YAC ability, blocking willingness, big-play threat', 'Lower-body injury earlier this season, needs to prove durability', 'Fits any NFL offense - X receiver in traditional systems or slot in modern schemes', 'Mike Evans lite', 'Solid WR2', 'Pro Bowl WR1', 'Low-medium - injury history slight concern'),

(4, 'Complete football player. Jumps off Ohio State tape playing like a veteran. Natural instincts, burst as pass rusher. Big riser in this class.', 'Elite instincts, pass rush versatility, veteran IQ, sideline-to-sideline speed, coverage ability', 'Needs to add strength for NFL level, still developing pass rush moves', 'Perfect for modern defenses that need LBs who can cover and rush - fits 3-4 or 4-3', 'Devin Lloyd', 'Starting-caliber LB', 'All-Pro 3-down linebacker', 'Low - complete skill set, high football IQ'),

(5, 'Transfer from Stanford where he had 14.5 sacks over 3 seasons - matched that in 2025 alone. Nation''s best pressure rate at 20.2%. Became a finisher.', 'Elite pass rush, best pressure rate in nation, finishing ability, versatile', 'Needs to improve run defense, sometimes too aggressive', 'Fits 3-4 OLB or 4-3 edge - best in attacking schemes', 'Carl Lawson', 'Quality starting edge rusher', 'Double-digit sack guy for a decade', 'Low-medium - one breakout year, but elite production'),

(6, 'Brother of NFL WR Josh Downs, son of former NFL RB Gary Downs. Extension of the defensive coordinator. Diagnoses quickly, excellent pre-snap instincts, solid coverage, reliable open-field tackler.', 'Football IQ, pre-snap recognition, tackling, coverage skills, versatility, leadership', 'Straight-line speed not elite, average size for position', 'Fits any NFL defense - center fielder in single-high or box safety in multiple schemes', 'Antoine Winfield Jr.', 'Starting safety', 'All-Pro safety for 10 years', 'Very low - complete player with elite IQ'),

(7, 'Powerful with strong hands. Routinely dominates offensive tackles with his rip move. Speed and bend off edge, excellent angles. Holds edge vs run. Never takes a play off - pure hustle.', 'Power, hand usage, rip move, versatility, effort, run defense, motor', 'Shorter arms than scouts prefer, needs to expand pass rush arsenal', 'Perfect for 4-3 edge or 3-4 DE - works in any attacking scheme', 'Montez Sweat', 'Solid starting edge', 'Perennial Pro Bowler', 'Low - high motor, proven production'),

(8, 'True mauler who destroys pass rushers at point of attack. 2600+ snaps at RT. Could stick there or slide inside to become Pro Bowl guard.', 'Elite power, pass protection, mauler mentality, versatile (OT or OG)', 'Needs to improve in space, footwork vs speed rushers', 'Fits any scheme - RT or RG depending on team needs', 'Zack Martin (if moved to guard)', 'Quality starting RT or Pro Bowl RG', 'All-Pro guard', 'Very low - dominant college player'),

(9, 'Physical specimen with sideline-to-sideline range. Versatile - can rush, cover, and stop the run. High football IQ.', 'Athleticism, versatility, coverage, run defense, pass rush ability', 'Needs to improve taking on blocks, consistency in gap fills', 'Perfect for multiple fronts - can play any LB position', 'Roquan Smith', 'Starting LB', 'All-Pro 3-down linebacker', 'Low - athletic freak with instincts'),

(10, 'Ball hawk safety with excellent range and coverage skills. Can play single-high or in the box.', 'Range, ball skills, coverage, tackling, versatility', 'Size concerns, needs to improve vs TEs', 'Fits any scheme - best as center fielder', 'Jessie Bates III', 'Starting safety', 'Pro Bowl safety', 'Low - proven production at Alabama');
