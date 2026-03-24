import { useEffect, useState } from "react";
import { getAdminDashboardStats } from "../services/adminDashboardService";

const numberFormatter = new Intl.NumberFormat("fr-FR");

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function DashboardSummaryCard({ label, value, helper, accent, subValue, subLabel }) {
  return (
    <article className={`admin-home__summary-card admin-home__summary-card--${accent}`}>
      <span className="admin-home__summary-label">{label}</span>
      <strong className="admin-home__summary-value">{formatNumber(value)}</strong>
      <p className="admin-home__summary-helper">{helper}</p>
      {subLabel ? (
        <div className="admin-home__summary-meta">
          <span>{subLabel}</span>
          <strong>{formatNumber(subValue)}</strong>
        </div>
      ) : null}
    </article>
  );
}

function DashboardInsightCard({ title, insight, accent }) {
  return (
    <article className={`admin-home__insight-card admin-home__insight-card--${accent}`}>
      <span className="admin-home__insight-title">{title}</span>
      <strong className="admin-home__insight-label">{insight.label}</strong>
      <div className="admin-home__insight-metric">{formatNumber(insight.value)}</div>
      <p className="admin-home__insight-helper">{insight.helper}</p>
    </article>
  );
}

function DashboardBarsChart({ title, items, emptyLabel, accent = "orange" }) {
  const maxValue = items.reduce((highestValue, item) => Math.max(highestValue, item.value), 0);

  return (
    <article className="admin-home__chart-card">
      <div className="admin-home__chart-head">
        <h2>{title}</h2>
      </div>

      {items.length === 0 || maxValue === 0 ? (
        <p className="admin-home__chart-empty">{emptyLabel}</p>
      ) : (
        <div className="admin-home__chart-list">
          {items.map((item) => {
            const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0) : 0;

            return (
              <div key={item.label} className="admin-home__chart-row">
                <div className="admin-home__chart-meta">
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
                <div className="admin-home__chart-track">
                  <span
                    className={`admin-home__chart-fill admin-home__chart-fill--${item.tone || accent}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function AdminAceulle({ content, admin }) {
  const [stats, setStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextStats = await getAdminDashboardStats();

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
  }, [content.errorMessage]);

  const summary = stats?.summary;
  const insights = stats?.insights;
  const charts = stats?.charts;

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
            <DashboardSummaryCard
              label={content.summaryPendingLabel}
              value={summary.pendingCount}
              helper={content.summaryPendingHelper}
              accent="pending"
            />
            <DashboardSummaryCard
              label={content.summaryAcceptedLabel}
              value={summary.acceptedCount}
              helper={content.summaryAcceptedHelper}
              accent="accepted"
            />
            <DashboardSummaryCard
              label={content.summaryVisibleLabel}
              value={summary.visibleThisMonthCount}
              helper={content.summaryVisibleHelper}
              accent="visible"
            />
            <DashboardSummaryCard
              label={content.summaryVisitsLabel}
              value={summary.totalVisits}
              helper={content.summaryVisitsHelper}
              accent="visits"
              subLabel={content.thisMonthLabel}
              subValue={summary.monthVisits}
            />
            <DashboardSummaryCard
              label={content.summaryVisitorsLabel}
              value={summary.totalVisitors}
              helper={content.summaryVisitorsHelper}
              accent="visitors"
              subLabel={content.thisMonthLabel}
              subValue={summary.monthVisitors}
            />
            <DashboardSummaryCard
              label="Revenus totaux"
              value={`${summary.totalRevenue} €`}
              helper="Revenus générés par toutes les réservations acceptées"
              accent="revenue"
            />
            <DashboardSummaryCard
              label="Revenus ce mois"
              value={`${summary.monthRevenue} €`}
              helper="Revenus générés ce mois-ci"
              accent="revenue"
            />
          </section>

          <section className="admin-home__insights-grid">
            <DashboardInsightCard
              title={content.insightTopVehicleTitle}
              insight={insights.topVehicle}
              accent="orange"
            />
            <DashboardInsightCard
              title={content.insightBusiestMonthTitle}
              insight={insights.busiestMonth}
              accent="dark"
            />
            <DashboardInsightCard
              title={content.insightBusiestWeekdayTitle}
              insight={insights.busiestWeekday}
              accent="light"
            />
          </section>

          <section className="admin-home__charts-grid">
            <DashboardBarsChart
              title={content.chartReservationsByMonthTitle}
              items={charts.reservationsByMonth}
              emptyLabel={content.emptyChartLabel}
            />
            <DashboardBarsChart
              title="Revenus par mois"
              items={charts.revenueByMonth.map(item => ({ ...item, value: `${item.value} €` }))}
              emptyLabel={content.emptyChartLabel}
              accent="revenue"
            />
            <DashboardBarsChart
              title={content.chartTopVehiclesTitle}
              items={charts.topVehicles}
              emptyLabel={content.emptyChartLabel}
              accent="dark"
            />
            <DashboardBarsChart
              title={content.chartReservationsByWeekdayTitle}
              items={charts.reservationsByWeekday}
              emptyLabel={content.emptyChartLabel}
              accent="light"
            />
            <DashboardBarsChart
              title={content.chartSiteVisitsTitle}
              items={charts.siteVisitsByDay}
              emptyLabel={content.emptyChartLabel}
              accent="cyan"
            />
            <DashboardBarsChart
              title={content.chartFleetStatusTitle}
              items={charts.fleetStatus}
              emptyLabel={content.emptyChartLabel}
              accent="orange"
            />
          </section>
        </>
      )}
    </main>
  );
}

export default AdminAceulle;
