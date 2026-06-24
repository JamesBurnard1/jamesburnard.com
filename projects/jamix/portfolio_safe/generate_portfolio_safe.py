from pathlib import Path
import math
import random

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib import cm
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
DATA = ROOT / "data"
RNG = np.random.default_rng(42)
random.seed(42)


plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.titleweight": "bold",
        "axes.titlepad": 14,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.grid": True,
        "grid.color": "#E7E1D8",
        "grid.linewidth": 0.7,
        "grid.alpha": 0.8,
    }
)


def synthetic_institutions(count=280):
    prefixes = [
        "Northlake",
        "Cedar",
        "Ridgeline",
        "Harbor",
        "Summit",
        "Prairie",
        "Westbridge",
        "Evergreen",
        "Redwood",
        "Stonefield",
        "Lakeshore",
        "Brookhaven",
        "Alta",
        "Fairmont",
        "Oak Valley",
        "Pinecrest",
    ]
    suffixes = [
        "University",
        "College",
        "Institute",
        "State University",
        "Technical University",
        "Liberal Arts College",
    ]

    carnegie = [
        "Small Residential",
        "Medium Residential",
        "Large Residential",
        "Commuter Four-Year",
        "Research University",
        "Special Focus",
    ]
    probs = [0.18, 0.24, 0.21, 0.14, 0.17, 0.06]

    rows = []
    for i in range(count):
        profile = RNG.choice(carnegie, p=probs)
        if profile == "Small Residential":
            enrollment = int(RNG.lognormal(7.55, 0.28))
            tuition = RNG.normal(31500, 7000)
            endowment = RNG.lognormal(19.2, 0.95)
        elif profile == "Medium Residential":
            enrollment = int(RNG.lognormal(8.35, 0.28))
            tuition = RNG.normal(28500, 8000)
            endowment = RNG.lognormal(19.7, 0.85)
        elif profile == "Large Residential":
            enrollment = int(RNG.lognormal(9.2, 0.35))
            tuition = RNG.normal(22500, 7000)
            endowment = RNG.lognormal(20.0, 0.9)
        elif profile == "Commuter Four-Year":
            enrollment = int(RNG.lognormal(9.0, 0.45))
            tuition = RNG.normal(13500, 4500)
            endowment = RNG.lognormal(18.2, 0.75)
        elif profile == "Research University":
            enrollment = int(RNG.lognormal(10.05, 0.35))
            tuition = RNG.normal(24500, 8500)
            endowment = RNG.lognormal(21.1, 0.95)
        else:
            enrollment = int(RNG.lognormal(7.75, 0.5))
            tuition = RNG.normal(26000, 9000)
            endowment = RNG.lognormal(18.9, 0.8)

        pell = np.clip(RNG.beta(2.6, 6.4) + (0.08 if "Commuter" in profile else 0), 0.04, 0.72)
        international = np.clip(RNG.beta(1.7, 13.0) + (0.035 if profile == "Research University" else 0), 0.002, 0.34)
        client_like = (
            enrollment > 1200
            and enrollment < 36000
            and tuition > 12000
            and pell < 0.48
            and RNG.random() < 0.09
        )

        rows.append(
            {
                "Institution": f"{random.choice(prefixes)} {random.choice(suffixes)} {i + 1:03d}",
                "Enrollment": max(350, min(enrollment, 82000)),
                "Carnegie_Profile": profile,
                "Pell_Grant_Rate": round(float(pell), 4),
                "International_Rate": round(float(international), 4),
                "Endowment": int(max(8_000_000, min(endowment, 38_000_000_000))),
                "Tuition_Revenue_per_FTE": int(max(4_000, min(tuition, 76000))),
                "Reference_Group": bool(client_like),
            }
        )

    df = pd.DataFrame(rows)
    if df["Reference_Group"].sum() < 18:
        picks = df.sample(24, random_state=42).index
        df.loc[picks, "Reference_Group"] = True
    return df


def savefig(name):
    plt.tight_layout()
    plt.savefig(ASSETS / name, dpi=180, bbox_inches="tight")
    plt.close()


def enrollment_distribution(df):
    bins = np.arange(0, 86000, 4000)
    labels = [f"{int(b / 1000)}k" for b in bins[:-1]]
    grouped = pd.cut(df["Enrollment"], bins=bins, labels=labels, include_lowest=True)
    counts = grouped.value_counts().sort_index()
    ref_counts = df[df["Reference_Group"]].groupby(grouped, observed=False).size().reindex(counts.index, fill_value=0)

    fig, ax = plt.subplots(figsize=(12, 5.6))
    colors = ["#8AD18F" if v == 0 else "#2E7D5B" for v in ref_counts]
    ax.bar(range(len(counts)), counts.values, color=colors, width=0.78)
    for i, (total, ref) in enumerate(zip(counts.values, ref_counts.values)):
        if total:
            ax.text(i, total + 1.1, str(int(ref)), ha="center", va="bottom", fontsize=8, color="#21362F")
    ax.set_title("Synthetic Enrollment Distribution")
    ax.set_xlabel("Enrollment band")
    ax.set_ylabel("Institution count")
    ax.set_xticks(range(len(counts)))
    ax.set_xticklabels(counts.index, rotation=70, fontsize=8)
    ax.set_ylim(0, max(counts.values) + 10)
    savefig("enrollment_distribution.png")


def profile_distribution(df):
    order = df["Carnegie_Profile"].value_counts().index
    counts = df["Carnegie_Profile"].value_counts().reindex(order)
    ref = df[df["Reference_Group"]]["Carnegie_Profile"].value_counts().reindex(order, fill_value=0)
    fig, ax = plt.subplots(figsize=(10, 5.4))
    ax.barh(order, counts, color="#93C5B0")
    ax.scatter(ref, order, s=110, color="#D95F43", zorder=3, label="reference subset count")
    for y, value in enumerate(ref):
        ax.text(value + 0.8, y, str(int(value)), va="center", fontsize=9, color="#3E3028")
    ax.set_title("Institution Type Coverage")
    ax.set_xlabel("Institution count")
    ax.set_ylabel("")
    ax.legend(frameon=False, loc="lower right")
    savefig("institution_type_coverage.png")


def demographic_scatter(df):
    fig, ax = plt.subplots(figsize=(9.8, 6.2))
    median_x = df["Pell_Grant_Rate"].median()
    median_y = df["International_Rate"].median()
    qx1, qx3 = df["Pell_Grant_Rate"].quantile([0.25, 0.75])
    qy1, qy3 = df["International_Rate"].quantile([0.25, 0.75])
    ax.axvspan(qx1, qx3, color="#DAD2C8", alpha=0.55, zorder=0)
    ax.axhspan(qy1, qy3, color="#DAD2C8", alpha=0.55, zorder=0)
    ax.axvline(median_x, color="#6B6258", lw=1.2)
    ax.axhline(median_y, color="#6B6258", lw=1.2)
    base = df[~df["Reference_Group"]]
    ref = df[df["Reference_Group"]]
    ax.scatter(base["Pell_Grant_Rate"], base["International_Rate"], s=36, edgecolor="#60A97A", facecolor="white", alpha=0.85)
    ax.scatter(ref["Pell_Grant_Rate"], ref["International_Rate"], s=48, edgecolor="#173F35", facecolor="#2E7D5B", alpha=0.95)
    ax.set_title("Student Demographic Positioning")
    ax.set_xlabel("Pell Grant rate")
    ax.set_ylabel("International student rate")
    ax.set_xlim(0, 0.75)
    ax.set_ylim(0, 0.36)
    ax.xaxis.set_major_formatter(lambda x, pos: f"{x:.0%}")
    ax.yaxis.set_major_formatter(lambda y, pos: f"{y:.0%}")
    savefig("demographic_scatter.png")


def endowment_curve(df):
    ranked = df.sort_values("Endowment").reset_index(drop=True)
    fig, ax = plt.subplots(figsize=(10.5, 5.4))
    ax.plot(ranked.index, ranked["Endowment"] / 1e9, color="#9ACB83", lw=2)
    ref = ranked[ranked["Reference_Group"]]
    ax.scatter(ref.index, ref["Endowment"] / 1e9, s=44, facecolor="white", edgecolor="#1E7052", lw=1.5, zorder=3)
    ax.set_title("Financial Capacity Curve")
    ax.set_xlabel("Synthetic institution rank")
    ax.set_ylabel("Endowment, USD billions")
    savefig("endowment_curve.png")


def clustering_plot(df):
    features = df[["Endowment", "Enrollment", "Tuition_Revenue_per_FTE"]].copy()
    features["Endowment"] = np.log10(features["Endowment"])
    scaled = StandardScaler().fit_transform(features)
    labels = KMeans(n_clusters=4, random_state=42, n_init=20).fit_predict(scaled)
    df = df.copy()
    df["Cluster"] = labels

    fig = plt.figure(figsize=(9.5, 7))
    ax = fig.add_subplot(111, projection="3d")
    colors = cm.Set2(labels / max(labels.max(), 1))
    ax.scatter(
        df["Enrollment"],
        df["Endowment"] / 1e9,
        df["Tuition_Revenue_per_FTE"],
        c=colors,
        s=32,
        depthshade=False,
        alpha=0.9,
    )
    ref = df[df["Reference_Group"]]
    ax.scatter(
        ref["Enrollment"],
        ref["Endowment"] / 1e9,
        ref["Tuition_Revenue_per_FTE"],
        marker="D",
        s=60,
        c="#21362F",
        depthshade=False,
    )
    ax.set_title("Synthetic 3D Market Clusters")
    ax.set_xlabel("Enrollment")
    ax.set_ylabel("Endowment, $B")
    ax.set_zlabel("Tuition revenue / FTE")
    ax.view_init(elev=24, azim=-58)
    savefig("market_clusters_3d.png")
    return df


def network_graph(df):
    methods = [
        ("3D Cluster", -0.1, 0.4, "#4C78A8"),
        ("Financial Fit", -0.85, -0.15, "#F58518"),
        ("Enrollment Fit", 0.5, -0.45, "#54A24B"),
        ("Demographic Fit", 0.92, 0.32, "#E45756"),
        ("Revenue Fit", -0.45, 0.88, "#B279A2"),
    ]
    candidates = df.sample(54, random_state=7).reset_index(drop=True)
    fig, ax = plt.subplots(figsize=(9, 6.2))
    ax.set_title("Opportunity Network, Synthetic Data")
    ax.axis("off")

    method_positions = {name: (x, y, color) for name, x, y, color in methods}
    for name, x, y, color in methods:
        ax.scatter(x, y, s=700, color=color, edgecolor="white", lw=2, zorder=4)
        ax.text(x, y, name, ha="center", va="center", color="white", fontsize=8, weight="bold", zorder=5)

    angles = np.linspace(0, 2 * math.pi, len(candidates), endpoint=False)
    radii = 0.42 + 0.18 * RNG.random(len(candidates))
    for i, row in candidates.iterrows():
        method_count = RNG.choice([1, 1, 2, 2, 3], p=[0.32, 0.24, 0.24, 0.15, 0.05])
        linked = random.sample(methods, int(method_count))
        anchor_x = np.mean([m[1] for m in linked])
        anchor_y = np.mean([m[2] for m in linked])
        x = anchor_x + radii[i] * math.cos(angles[i] * 2.5)
        y = anchor_y + radii[i] * math.sin(angles[i] * 2.5)
        size = 26 + 16 * method_count
        for method in linked:
            mx, my, color = method_positions[method[0]]
            ax.plot([mx, x], [my, y], color=color, lw=0.7, alpha=0.32, zorder=1)
        ax.scatter(x, y, s=size, color="#6FA8DC", edgecolor="white", lw=0.7, zorder=3)

    savefig("opportunity_network.png")


def write_html():
    html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Institutional Market Segmentation Case Study</title>
  <style>
    :root {
      --ink: #20302b;
      --muted: #65736c;
      --paper: #fbfaf7;
      --line: #ded8cf;
      --green: #277456;
      --clay: #d95f43;
      --blue: #3c78a8;
      --gold: #c69731;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--paper);
      line-height: 1.5;
    }
    header {
      min-height: 86vh;
      display: grid;
      align-items: end;
      padding: 56px clamp(20px, 6vw, 80px);
      background:
        linear-gradient(rgba(251, 250, 247, 0.16), rgba(251, 250, 247, 0.92)),
        url("assets/demographic_scatter.png") center / cover no-repeat;
      border-bottom: 1px solid var(--line);
    }
    .hero {
      max-width: 940px;
      padding-bottom: 8vh;
    }
    .eyebrow {
      color: var(--green);
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0;
      font-size: 0.82rem;
    }
    h1 {
      margin: 12px 0 18px;
      max-width: 900px;
      font-size: clamp(2.4rem, 6vw, 5.9rem);
      line-height: 0.95;
      letter-spacing: 0;
    }
    .lede {
      max-width: 760px;
      font-size: clamp(1.05rem, 1.7vw, 1.32rem);
      color: #31433c;
    }
    main { padding: 0 clamp(20px, 6vw, 80px) 72px; }
    section {
      max-width: 1180px;
      margin: 0 auto;
      padding: 56px 0;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      margin: 0 0 16px;
      font-size: clamp(1.55rem, 3vw, 2.5rem);
      letter-spacing: 0;
    }
    p { max-width: 820px; color: var(--muted); margin: 0 0 18px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }
    .metric {
      border-top: 4px solid var(--green);
      padding: 18px 0 0;
      min-width: 0;
    }
    .metric:nth-child(2) { border-color: var(--clay); }
    .metric:nth-child(3) { border-color: var(--blue); }
    .metric:nth-child(4) { border-color: var(--gold); }
    .metric strong {
      display: block;
      font-size: clamp(1.8rem, 4vw, 3.4rem);
      line-height: 1;
    }
    .metric span {
      display: block;
      color: var(--muted);
      margin-top: 8px;
      font-size: 0.95rem;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      margin-top: 28px;
    }
    figure {
      margin: 0;
      background: #fffdfa;
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }
    figure img {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: contain;
      background: white;
      padding: 12px;
    }
    figcaption {
      padding: 14px 16px 16px;
      color: #56635d;
      font-size: 0.95rem;
      border-top: 1px solid var(--line);
    }
    .wide { grid-column: 1 / -1; }
    .note {
      margin-top: 28px;
      padding: 18px 20px;
      border-left: 5px solid var(--green);
      background: #eef4ef;
      color: #34463f;
      max-width: 920px;
    }
    footer {
      padding: 36px clamp(20px, 6vw, 80px);
      color: var(--muted);
    }
    @media (max-width: 780px) {
      header { min-height: 78vh; }
      .metrics, .gallery { grid-template-columns: 1fr; }
      .wide { grid-column: auto; }
      section { padding: 42px 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="hero">
      <div class="eyebrow">Portfolio-safe synthetic case study</div>
      <h1>Institutional Market Segmentation Dashboard</h1>
      <p class="lede">A Python and Tableau-style analytics workflow for segmenting higher-education institutions by enrollment, financial capacity, and student demographics. Visuals shown here use synthetic data to preserve confidentiality.</p>
    </div>
  </header>

  <main>
    <section>
      <h2>Project Shape</h2>
      <p>I built a data preparation and visualization workflow that transforms messy institutional records into decision-ready market segments. The public version keeps the same analytical structure while replacing all company-sensitive names, counts, and recommendations with generated sample data.</p>
      <div class="metrics">
        <div class="metric"><strong>280</strong><span>synthetic institution records</span></div>
        <div class="metric"><strong>6</strong><span>segmentation dimensions</span></div>
        <div class="metric"><strong>4</strong><span>K-means clusters</span></div>
        <div class="metric"><strong>0</strong><span>real clients or leads exposed</span></div>
      </div>
    </section>

    <section>
      <h2>Dashboard Preview</h2>
      <p>The visuals demonstrate the same portfolio skills as the original work: distribution analysis, demographic positioning, financial-capacity curves, 3D clustering, and network-based prioritization.</p>
      <div class="gallery">
        <figure>
          <img src="assets/enrollment_distribution.png" alt="Synthetic enrollment distribution bar chart">
          <figcaption>Enrollment distribution with a mock reference subset, useful for showing market coverage by institution size.</figcaption>
        </figure>
        <figure>
          <img src="assets/institution_type_coverage.png" alt="Synthetic institution type coverage chart">
          <figcaption>Institution type coverage across synthetic Carnegie-style profiles.</figcaption>
        </figure>
        <figure>
          <img src="assets/demographic_scatter.png" alt="Synthetic demographic scatter plot">
          <figcaption>Demographic positioning using Pell Grant rate and international student share.</figcaption>
        </figure>
        <figure>
          <img src="assets/endowment_curve.png" alt="Synthetic financial capacity curve">
          <figcaption>Financial capacity curve, with the long-tail pattern preserved without exposing actual institutions.</figcaption>
        </figure>
        <figure>
          <img src="assets/market_clusters_3d.png" alt="Synthetic 3D market cluster plot">
          <figcaption>3D market clusters using enrollment, endowment, and tuition revenue per FTE.</figcaption>
        </figure>
        <figure>
          <img src="assets/opportunity_network.png" alt="Synthetic opportunity network graph">
          <figcaption>Network view showing how mock institutions appear across multiple analytical methods.</figcaption>
        </figure>
      </div>
      <div class="note">Confidentiality note: this page is a reconstructed portfolio artifact. It does not include real company data, real client names, sales-qualified leads, exact counts, internal recommendations, or original report screenshots.</div>
    </section>

    <section>
      <h2>Methods</h2>
      <p>Data cleaning, feature standardization, enrollment binning, distribution analysis, K-means clustering, Euclidean similarity scoring, and network visualization. The original business context has been generalized so the work can be discussed publicly without revealing proprietary strategy.</p>
    </section>
  </main>

  <footer>
    Prepared as a public-safe portfolio mockup.
  </footer>
</body>
</html>
"""
    (ROOT / "index.html").write_text(html, encoding="utf-8")


def main():
    ASSETS.mkdir(exist_ok=True)
    DATA.mkdir(exist_ok=True)
    df = synthetic_institutions()
    df.to_csv(DATA / "synthetic_institution_segments.csv", index=False)
    enrollment_distribution(df)
    profile_distribution(df)
    demographic_scatter(df)
    endowment_curve(df)
    clustered = clustering_plot(df)
    network_graph(clustered)
    write_html()
    print(f"Wrote portfolio-safe case study to {ROOT / 'index.html'}")


if __name__ == "__main__":
    main()
