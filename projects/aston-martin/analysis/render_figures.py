"""Reproduce exploration.ipynb's race filters and redraw its exploratory figures.
Run from the website root: python3 projects/aston-martin/analysis/render_figures.py --cache /path/to/Pitwall-F1/cache
Dependencies: fastf1, pandas, numpy, matplotlib. No fitted model is introduced.
"""
import argparse, json
from pathlib import Path
import fastf1
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);args=parser.parse_args()
fastf1.Cache.enable_cache(args.cache)
s=fastf1.get_session(2024,'Silverstone','R');s.load(telemetry=False)
r=s.laps.copy();r['DidPit']=np.where(r.PitInTime.notna()|r.PitOutTime.notna(),'Yes','No');r['LapTimeSeconds']=r.LapTime.dt.total_seconds()
c=r[(r.TrackStatus.astype(str)=='1')&(r.DidPit=='No')].copy()
q1=c.LapTimeSeconds.quantile(.25);q3=c.LapTimeSeconds.quantile(.75);iqr=q3-q1;lo=q1-1.5*iqr;hi=q3+1.5*iqr
f=c[c.LapTimeSeconds.between(lo,hi)].copy()
w=pd.merge_asof(f.drop(columns='Time').sort_values('LapStartTime'),s.weather_data.sort_values('Time'),left_on='LapStartTime',right_on='Time',direction='nearest')
h=w[w.Driver=='HAM'].sort_values('LapNumber')
out=Path(__file__).resolve().parents[1]/'figures';out.mkdir(exist_ok=True)
colors={1:'#5c7967',2:'#5c7c99',3:'#b97855'}
labels={1:'Stint 1 · Medium',2:'Stint 2 · Intermediate',3:'Stint 3 · Soft'}
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':'#30312e','axes.labelcolor':'#30312e','xtick.color':'#73766e','ytick.color':'#73766e','axes.edgecolor':'#c9cbc4','figure.facecolor':'#fdfcf9','axes.facecolor':'#fdfcf9','svg.fonttype':'none','savefig.facecolor':'#fdfcf9'})
def style(ax):
 ax.spines[['top','right']].set_visible(False);ax.grid(axis='y',color='#deded7',lw=.65);ax.set_axisbelow(True);ax.tick_params(length=0,pad=8)
def save(fig,name):
 fig.savefig(out/(name+'.svg'),bbox_inches='tight');fig.savefig(out/(name+'.png'),bbox_inches='tight',dpi=180);plt.close(fig)

a,ax=plt.subplots(figsize=(10,3.4),layout='constrained')
for pos,df in enumerate([c,f]):
 ax.boxplot(df.LapTimeSeconds.dropna(),positions=[pos],vert=False,widths=.32,patch_artist=True,boxprops={'facecolor':'#dce4dd','edgecolor':'#5c7967'},medianprops={'color':'#30312e','linewidth':1.6},whiskerprops={'color':'#73766e'},capprops={'color':'#73766e'},flierprops={'marker':'o','markersize':4,'markerfacecolor':'#b97855','markeredgecolor':'#b97855'})
ax.set_yticks([0,1],['Pit/status screen\n868 laps','After IQR screen\n867 laps']);ax.invert_yaxis();ax.set_xlabel('Lap time (seconds)');ax.set_xlim(85,118);style(ax);ax.grid(axis='y',visible=False);ax.grid(axis='x',color='#deded7',lw=.65)
ax.set_title('A light screening step: one lap removed',loc='left',fontsize=16,pad=22,fontweight='medium');save(a,'lap-screening')

a,ax=plt.subplots(figsize=(10,4.8),layout='constrained')
for stint,g in h.groupby('Stint'):
 ax.scatter(g.TyreLife,g.LapTimeSeconds,s=34,color=colors[int(stint)],label=labels[int(stint)],zorder=3)
ax.set_xlabel('Tyre age (laps)');ax.set_ylabel('Lap time (seconds)');style(ax);ax.legend(frameon=False,loc='upper left',ncols=3,fontsize=10,handletextpad=.4,columnspacing=1.1,bbox_to_anchor=(0,1.13));ax.set_title('Hamilton: pace within each tyre stint',loc='left',fontsize=16,pad=52,fontweight='medium');save(a,'hamilton-tyre-age')

a,axes=plt.subplots(3,1,figsize=(10,8),sharex=True,layout='constrained',gridspec_kw={'height_ratios':[2,1.5,.6]})
for stint,g in h.groupby('Stint'):axes[0].scatter(g.LapNumber,g.LapTimeSeconds,s=32,color=colors[int(stint)],label=labels[int(stint)],zorder=3)
axes[0].set_ylabel('Lap time (s)');axes[0].legend(frameon=False,ncols=3,fontsize=10,loc='upper left',bbox_to_anchor=(0,1.2));axes[0].set_title('Race pace and the changing weather',loc='left',fontsize=16,pad=52,fontweight='medium')
axes[1].plot(h.LapNumber,h.TrackTemp,color='#b97855',lw=1.8,label='Track');axes[1].plot(h.LapNumber,h.AirTemp,color='#5c7c99',lw=1.8,ls='--',label='Air');axes[1].set_ylabel('Temperature (°C)');axes[1].legend(frameon=False,ncols=2,loc='upper right',fontsize=10)
# Rain is a reported Boolean at the nearest matched observation, not intensity.
axes[2].scatter(h.LapNumber,np.zeros(len(h)),s=32,marker='s',c=np.where(h.Rainfall,'#5c7c99','#dcded8'));axes[2].set_yticks([0],['Rain report']);axes[2].set_ylim(-1,1);axes[2].set_xlabel('Race lap');axes[2].legend(handles=[Line2D([],[],marker='s',color='#5c7c99',ls='',label='Reported'),Line2D([],[],marker='s',color='#dcded8',ls='',label='Not reported')],frameon=False,ncols=2,fontsize=10,loc='upper right')
for ax in axes:style(ax)
axes[2].grid(False);axes[2].spines[['left','top','right']].set_visible(False);axes[2].set_xlim(0,53);save(a,'hamilton-weather')
cols=['Driver','Stint','LapNumber','Compound','TyreLife','LapTimeSeconds','LapStartTime','Time','TrackTemp','AirTemp','Rainfall']
w[cols].to_csv(out/'lap-weather-data.csv',index=False)
stats={'source_notebook':'Pitwall-F1/exploration.ipynb, cells 3–9','fastf1_version':fastf1.__version__,'event':'2024 British Grand Prix, race','race_laps':len(r),'screened_laps':len(c),'iqr_retained_laps':len(f),'q1_seconds':q1,'q3_seconds':q3,'iqr_seconds':iqr,'lower_seconds':lo,'upper_seconds':hi,'hamilton_laps':len(h)}
(out/'provenance.json').write_text(json.dumps(stats,indent=2)+'\n')
print(json.dumps(stats,indent=2))
