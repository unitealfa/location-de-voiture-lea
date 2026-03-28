import { useEffect, useState } from "react";
import { getAdminDashboardStats, getCachedAdminDashboardStats } from "../services/adminDashboardService";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0
});
const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Fevrier" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Aout" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Decembre" }
];

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function getSeriesTitle(baseLabel, view) {
  if (view === "month") {
    return `${baseLabel} par semaine`;
  }

  if (view === "year") {
    return `${baseLabel} par mois`;
  }

  return `${baseLabel} par an`;
}

function SummaryCard({
  label,
  value,
  helper,
  accent,
  formatter = formatNumber,
  kicker = "Synthese",
  headerExtra = null
}) {
  return (
    <article className={`admin-home__summary-card admin-home__summary-card--${accent}`}>
      <div className="admin-home__summary-head">
        <span className="admin-home__summary-kicker">{kicker}</span>
        <div className="admin-home__summary-head-side">
          {headerExtra}
          <span className="admin-home__summary-accent" />
        </div>
      </div>
      <span className="admin-home__summary-label">{label}</span>
      <strong className="admin-home__summary-value">{formatter(value)}</strong>
      <p className="admin-home__summary-helper">{helper}</p>
    </article>
  );
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      className={"admin-home__filter-pill" + (active ? " admin-home__filter-pill--active" : "")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function VehicleHeroCard({ title, insight }) {
  return (
    <article className="admin-home__feature-card admin-home__feature-card--vehicle">
      <div className="admin-home__feature-media">
        {insight.photoUrl ? (
          <img src={insight.photoUrl} alt={insight.label} loading="lazy" decoding="async" />
        ) : (
          <div className="admin-home__feature-media-placeholder">Aucune photo</div>
        )}
      </div>
      <div className="admin-home__feature-body">
        <span className="admin-home__feature-title">{title}</span>
        <strong className="admin-home__feature-label">{insight.label}</strong>
        <div className="admin-home__feature-metric">{formatNumber(insight.value)}</div>
        <p className="admin-home__feature-helper">{insight.helper}</p>
      </div>
    </article>
  );
}

function PeriodInsightCard({ title, insight, items }) {
  const chartWidth = 360;
  const chartHeight = 150;
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, item.value), 0);

  if (items.length === 0 || maxValue === 0) {
    return (
      <article className="admin-home__feature-card admin-home__feature-card--graph">
        <div className="admin-home__feature-body">
          <span className="admin-home__feature-title">{title}</span>
          <strong className="admin-home__feature-label">{insight.label}</strong>
          <div className="admin-home__feature-metric">{formatNumber(insight.value)}</div>
          <p className="admin-home__feature-helper">{insight.helper}</p>
        </div>
      </article>
    );
  }

  const points = items.map((item, index) => {
    const x = items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth;
    const y = chartHeight - (item.value / maxValue) * (chartHeight - 32) - 16;
    return { ...item, x, y };
  });
  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaData = `${pathData} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <article className="admin-home__feature-card admin-home__feature-card--graph">
      <div className="admin-home__feature-body">
        <span className="admin-home__feature-title">{title}</span>
        <strong className="admin-home__feature-label">{insight.label}</strong>
        <div className="admin-home__feature-metric">{formatNumber(insight.value)}</div>
        <p className="admin-home__feature-helper">{insight.helper}</p>
      </div>
      <div className="admin-home__feature-graph-wrap">
        <div className="admin-home__feature-line-chart">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <path className="admin-home__feature-line-area" d={areaData} />
            <path className="admin-home__feature-line-stroke" d={pathData} />
            {points.map((point) => (
              <circle key={`${title}-${point.label}`} className="admin-home__feature-line-point" cx={point.x} cy={point.y} r="4.5" />
            ))}
          </svg>
        </div>
        <div className="admin-home__feature-axis">
          {items.map((item) => (
            <span key={`${title}-${item.label}-axis`}>{item.label}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function WeekdayInsightCard({ title, insight, items }) {
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, item.value), 0);

  return (
    <article className="admin-home__feature-card admin-home__feature-card--graph admin-home__feature-card--columns-compact">
      <div className="admin-home__feature-body">
        <span className="admin-home__feature-title">{title}</span>
        <strong className="admin-home__feature-label">{insight.label}</strong>
        <div className="admin-home__feature-metric">{formatNumber(insight.value)}</div>
        <p className="admin-home__feature-helper">{insight.helper}</p>
      </div>
      <div className="admin-home__columns-chart admin-home__columns-chart--compact">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="admin-home__column-item admin-home__column-item--compact">
            <div className="admin-home__column-value admin-home__column-value--compact">{formatNumber(item.value)}</div>
            <div className="admin-home__column-track admin-home__column-track--compact">
              <span
                className="admin-home__column-fill admin-home__column-fill--weekday"
                style={{ height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              />
            </div>
            <div className="admin-home__column-label admin-home__column-label--weekday">{item.label.slice(0, 3)}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function LineChart({ title, items, accent = "orange", formatter = formatNumber, emptyLabel }) {
  const chartWidth = 600;
  const chartHeight = 220;
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, item.value), 0);

  if (items.length === 0 || maxValue === 0) {
    return (
      <article className="admin-home__chart-card admin-home__chart-card--line">
        <div className="admin-home__chart-head"><h2>{title}</h2></div>
        <p className="admin-home__chart-empty">{emptyLabel}</p>
      </article>
    );
  }

  const points = items.map((item, index) => {
    const x = items.length === 1 ? chartWidth / 2 : (index / (items.length - 1)) * chartWidth;
    const y = chartHeight - (item.value / maxValue) * (chartHeight - 30) - 15;
    return { ...item, x, y };
  });
  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaData = `${pathData} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <article className="admin-home__chart-card admin-home__chart-card--line">
      <div className="admin-home__chart-head"><h2>{title}</h2></div>
      <div className="admin-home__line-chart">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          <path className={`admin-home__line-area admin-home__line-area--${accent}`} d={areaData} />
          <path className={`admin-home__line-stroke admin-home__line-stroke--${accent}`} d={pathData} />
          {points.map((point) => (
            <circle
              key={`${title}-${point.label}`}
              className={`admin-home__line-point admin-home__line-point--${accent}`}
              cx={point.x}
              cy={point.y}
              r="4.5"
            />
          ))}
        </svg>
      </div>
      <div className="admin-home__line-footer">
        {points.map((point) => (
          <div key={`${title}-${point.label}-meta`} className="admin-home__line-meta">
            <span>{point.label}</span>
            <strong>{formatter(point.value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function ColumnChart({ title, items, accent = "orange", formatter = formatNumber, emptyLabel }) {
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, item.value), 0);

  if (items.length === 0 || maxValue === 0) {
    return (
      <article className="admin-home__chart-card admin-home__chart-card--columns">
        <div className="admin-home__chart-head"><h2>{title}</h2></div>
        <p className="admin-home__chart-empty">{emptyLabel}</p>
      </article>
    );
  }

  return (
    <article className="admin-home__chart-card admin-home__chart-card--columns">
      <div className="admin-home__chart-head"><h2>{title}</h2></div>
      <div className="admin-home__columns-chart">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="admin-home__column-item">
            <div className="admin-home__column-value">{formatter(item.value)}</div>
            <div className="admin-home__column-track">
              <span
                className={`admin-home__column-fill admin-home__column-fill--${accent}`}
                style={{ height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              />
            </div>
            <div className="admin-home__column-label">{item.label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SplitChart({ title, items, emptyLabel }) {
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="admin-home__chart-card admin-home__chart-card--split">
      <div className="admin-home__chart-head"><h2>{title}</h2></div>
      {items.length === 0 || totalValue === 0 ? (
        <p className="admin-home__chart-empty">{emptyLabel}</p>
      ) : (
        <>
          <div className="admin-home__split-bar">
            {items.map((item) => (
              <span
                key={item.label}
                className={`admin-home__split-segment admin-home__split-segment--${item.tone}`}
                style={{ width: `${(item.value / totalValue) * 100}%` }}
              />
            ))}
          </div>
          <div className="admin-home__split-legend">
            {items.map((item) => (
              <div key={item.label} className="admin-home__split-item">
                <span className={`admin-home__split-dot admin-home__split-dot--${item.tone}`} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{formatNumber(item.value)}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

function AdminAceulle({ content, admin }) {
  const today = new Date();
  const [filters, setFilters] = useState({
    view: "month",
    year: today.getFullYear(),
    month: today.getMonth() + 1
  });
  const [stats, setStats] = useState(() => getCachedAdminDashboardStats({ view: "month", year: today.getFullYear(), month: today.getMonth() + 1 }));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(() => !getCachedAdminDashboardStats({ view: "month", year: today.getFullYear(), month: today.getMonth() + 1 }));
  const [visitRangeFilter, setVisitRangeFilter] = useState("month");
  const [visitorRangeFilter, setVisitorRangeFilter] = useState("month");

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(() => !stats);
      setErrorMessage("");

      try {
        const nextStats = await getAdminDashboardStats(filters);

        if (!isActive) {
          return;
        }

        setStats(nextStats);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error.message || content.errorMessage);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [content.errorMessage, filters]);

  const summary = stats?.summary;
  const insights = stats?.insights;
  const charts = stats?.charts;
  const availableYears = stats?.filters?.availableYears || [filters.year];
  const activeView = stats?.filters?.view || filters.view;
  const activeYear = stats?.filters?.year || filters.year;
  const activeMonth = stats?.filters?.month || filters.month;
  const visitRangeSummary = summary?.visitRanges?.[visitRangeFilter] || {
    totalVisits: summary?.totalVisits || 0,
    totalVisitors: summary?.totalVisitors || 0
  };
  const visitorRangeSummary = summary?.visitRanges?.[visitorRangeFilter] || {
    totalVisits: summary?.totalVisits || 0,
    totalVisitors: summary?.totalVisitors || 0
  };
  const visitFilterControls = (
    <div className="admin-home__summary-mini-filter">
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitRangeFilter === "day" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitRangeFilter("day")}
      >
        {content.summaryVisitsFilterDayLabel}
      </button>
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitRangeFilter === "week" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitRangeFilter("week")}
      >
        {content.summaryVisitsFilterWeekLabel}
      </button>
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitRangeFilter === "month" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitRangeFilter("month")}
      >
        {content.summaryVisitsFilterMonthLabel}
      </button>
    </div>
  );
  const visitorFilterControls = (
    <div className="admin-home__summary-mini-filter">
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitorRangeFilter === "day" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitorRangeFilter("day")}
      >
        {content.summaryVisitsFilterDayLabel}
      </button>
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitorRangeFilter === "week" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitorRangeFilter("week")}
      >
        {content.summaryVisitsFilterWeekLabel}
      </button>
      <button
        type="button"
        className={"admin-home__summary-mini-pill" + (visitorRangeFilter === "month" ? " admin-home__summary-mini-pill--active" : "")}
        onClick={() => setVisitorRangeFilter("month")}
      >
        {content.summaryVisitsFilterMonthLabel}
      </button>
    </div>
  );

  return (
    <main className="admin-home">
      <section className="admin-home__hero">
        <div className="admin-home__hero-copy">
          <p className="admin-home__eyebrow">{content.eyebrow}</p>
          <h1>
            {content.titlePrefix}, {admin.username}
          </h1>
          <p>{content.description}</p>
        </div>

        <div className="admin-home__hero-side">
          <span>{content.fleetCountLabel}</span>
          <strong>{formatNumber(summary?.vehicleCount || 0)}</strong>
          <p>{content.summaryAcceptedHelper}</p>
        </div>
      </section>

      <section className="admin-home__filters">
        <div className="admin-home__filters-copy">
          <span>{content.filterViewLabel}</span>
          <div className="admin-home__filters-pills">
            <FilterButton
              label={content.filterViewMonthLabel}
              active={activeView === "month"}
              onClick={() => setFilters((current) => ({ ...current, view: "month" }))}
            />
            <FilterButton
              label={content.filterViewYearLabel}
              active={activeView === "year"}
              onClick={() => setFilters((current) => ({ ...current, view: "year" }))}
            />
            <FilterButton
              label={content.filterViewAllLabel}
              active={activeView === "all"}
              onClick={() => setFilters((current) => ({ ...current, view: "all" }))}
            />
          </div>
        </div>

        <div className="admin-home__filters-controls">
          {activeView === "month" ? (
            <label className="admin-home__filter-field">
              <span>{content.filterMonthLabel}</span>
              <select
                value={activeMonth}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    month: Number(event.target.value)
                  }))
                }
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {activeView !== "all" ? (
            <label className="admin-home__filter-field">
              <span>{content.filterYearLabel}</span>
              <select
                value={activeYear}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    year: Number(event.target.value)
                  }))
                }
              >
                {availableYears.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <section className="vehicles-empty">
          <p className="status-message">{content.loadingLabel}</p>
        </section>
      ) : errorMessage ? (
        <section className="vehicles-empty">
          <p className="login-form__message login-form__message--error">{errorMessage}</p>
        </section>
      ) : (
        <>
          <section className="admin-home__summary-grid">
            <SummaryCard label={content.summaryPendingLabel} value={summary.pendingCount} helper={content.summaryPendingHelper} accent="pending" />
            <SummaryCard label={content.summaryAcceptedLabel} value={summary.acceptedCount} helper={content.summaryAcceptedHelper} accent="accepted" />
            <SummaryCard label={content.summaryVisibleLabel} value={summary.visibleThisMonthCount} helper={content.summaryVisibleHelper} accent="visible" />
            <SummaryCard
              label={content.summaryVisitsLabel}
              value={visitRangeSummary.totalVisits}
              helper={content.summaryVisitsHelper}
              accent="visits"
              kicker={content.summaryVisitsFilterLabel}
              headerExtra={visitFilterControls}
            />
            <SummaryCard
              label={content.summaryVisitorsLabel}
              value={visitorRangeSummary.totalVisitors}
              helper={content.summaryVisitorsHelper}
              accent="visitors"
              kicker={content.summaryVisitsFilterLabel}
              headerExtra={visitorFilterControls}
            />
            <SummaryCard label={content.summaryRevenueLabel} value={summary.totalRevenue} helper={content.summaryRevenueHelper} accent="revenue" formatter={formatCurrency} />
            <SummaryCard
              label={content.summaryRangeLabel}
              value={activeView === "month" ? `${MONTH_OPTIONS[activeMonth - 1]?.label} ${activeYear}` : activeView === "year" ? activeYear : content.filterViewAllLabel}
              helper={content.summaryRangeHelper}
              accent="range"
              formatter={(value) => value}
            />
          </section>

          <section className="admin-home__feature-grid">
            <VehicleHeroCard title={content.insightTopVehicleTitle} insight={insights.topVehicle} />
            <PeriodInsightCard title={content.insightBusiestMonthTitle} insight={insights.busiestMonth} items={charts.periodDistribution} />
            <WeekdayInsightCard title={content.insightBusiestWeekdayTitle} insight={insights.busiestWeekday} items={charts.reservationsByWeekday} />
          </section>

          <section className="admin-home__charts-grid">
            <ColumnChart
              title={getSeriesTitle(content.lineReservationsTitle, activeView)}
              items={charts.reservationsSeries}
              emptyLabel={content.emptyChartLabel}
              accent="orange"
            />
            <ColumnChart
              title={getSeriesTitle(content.chartRevenueTitle, activeView)}
              items={charts.revenueSeries}
              emptyLabel={content.emptyChartLabel}
              accent="revenue"
              formatter={formatCurrency}
            />
            <LineChart
              title={getSeriesTitle(content.lineVisitsTitle, activeView)}
              items={charts.visitsSeries}
              emptyLabel={content.emptyChartLabel}
              accent="cyan"
            />
            <ColumnChart
              title={content.barsTopVehiclesTitle}
              items={charts.topVehicles}
              emptyLabel={content.emptyChartLabel}
              accent="dark"
            />
            <ColumnChart
              title={content.barsWeekdayTitle}
              items={charts.reservationsByWeekday}
              emptyLabel={content.emptyChartLabel}
              accent="light"
            />
            <SplitChart
              title={content.chartFleetStatusTitle}
              items={charts.fleetStatus}
              emptyLabel={content.emptyChartLabel}
            />
          </section>
        </>
      )}
    </main>
  );
}

export default AdminAceulle;
