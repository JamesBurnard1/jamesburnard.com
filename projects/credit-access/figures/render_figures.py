"""Render editorial SVG figures from the original notebook's displayed results."""
from pathlib import Path
from html import escape
OUT = Path(__file__).resolve().parent
INK='#30312e'; MUTED='#646963'; LINE='#d9ddd6'
def start(w,h,title,description):
 return [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc><rect width="100%" height="100%" fill="#fbfaf6"/><g font-family="Georgia, Times New Roman, serif" fill="{INK}">']
def text(s,x,y,value,size=18,fill=INK,anchor='start',extra=''):
 s.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" {extra}>{escape(value)}</text>')
def rule(s,y,x=32,end=868):s.append(f'<path d="M{x} {y}H{end}" stroke="{LINE}"/>')
def finish(s,name):
 s.append('</g></svg>');(OUT/name).write_text('\n'.join(s))
s=start(900,630,'Correlation matrix','Pearson correlations: credit score and credit balance 0.76; credit score and delinquency −0.96; credit balance and delinquency −0.71. Diagonal values are 1.00. Values retain the original figure’s two-decimal precision.')
text(s,32,45,'Relationships between credit measures',25)
text(s,32,75,'Pearson correlation · original analysis dataset',16,MUTED)
labels=['Credit score','Credit balance','Delinquency rate']; vals=[[1,.76,-.96],[.76,1,-.71],[-.96,-.71,1]]
colors={1:'#526d5e',.76:'#789081',-.96:'#687e92',-.71:'#8c9eac'}
for j,label in enumerate(labels):text(s,350+j*200,125,label,17,anchor='middle')
for i,label in enumerate(labels):
 text(s,230,218+i*120,label,18,anchor='end')
 for j,v in enumerate(vals[i]):
  x=252+j*200;y=152+i*120
  s.append(f'<rect x="{x}" y="{y}" width="196" height="116" fill="{colors[v]}"/>')
  text(s,x+98,y+69,f'{v:.2f}'.replace('-','−'),29,'#ffffff','middle')
rule(s,540)
s.append('<rect x="32" y="560" width="16" height="16" fill="#687e92"/>')
text(s,58,574,'Negative association',16,MUTED)
s.append('<rect x="280" y="560" width="16" height="16" fill="#526d5e"/>')
text(s,306,574,'Positive association',16,MUTED)
text(s,32,608,'−1 = perfect negative association · 0 = no linear association · +1 = perfect positive association',15,MUTED)
finish(s,'credit-correlation.svg')
low=[('Castro','Black','559.450000','0.859850'),('Dickens','Black','566.050000','0.925850'),('Wheeler','Black','569.300000','1.049250'),('Dixie','Black','572.150000','0.867250'),('Graham','AIAN','577.717857','0.712482')]
high=[('New York','Asian','769.823810','0.129559'),('Orange','Asian','767.550379','0.172131'),('Charlottesville City','Asian','767.500000','0.105205'),('Norfolk','Asian','766.448188','0.147567'),('Brazos','Asian','764.193382','0.160055')]
s=start(900,875,'Selected county–race subgroups at opposite ends of the credit relationship','Two tables preserve the notebook’s five low-score/high-delinquency and five high-score/low-delinquency observations, including county names, race labels, credit scores, and raw delinquency values. These are selected subgroups, not overall county rankings.')
text(s,32,45,'Contrasting county–race credit outcomes',25)
text(s,32,75,'Five observations selected at each end of the score–delinquency relationship',16,MUTED)
for title,rows,top,color in [('Lower credit scores · higher delinquency',low,124,'#687e92'),('Higher credit scores · lower delinquency',high,448,'#526d5e')]:
 text(s,32,top,title,22,color)
 text(s,32,top+40,'County',15,MUTED);text(s,420,top+40,'Race subgroup',15,MUTED)
 text(s,672,top+40,'Credit score',15,MUTED,'end');text(s,868,top+40,'Delinquency rate',15,MUTED,'end')
 rule(s,top+54)
 for i,(county,race,score,rate) in enumerate(rows):
  y=top+87+i*43
  text(s,32,y,county,18);text(s,420,y,race,18)
  text(s,672,y,score,18,anchor='end',extra='font-variant-numeric="tabular-nums"')
  text(s,868,y,rate,18,anchor='end',extra='font-variant-numeric="tabular-nums"')
  rule(s,y+14)
text(s,32,787,'Selection: five nearest observations to each extreme, using the notebook’s squared-distance rule.',15,MUTED)
text(s,32,815,'Values are reproduced as reported; delinquency is shown on its original scale, not as a percentage.',15,MUTED)
text(s,32,843,'AIAN = American Indian / Alaska Native. Each row describes a county–race subgroup, not a county overall.',15,MUTED)
finish(s,'credit-extreme-subgroups.svg')
