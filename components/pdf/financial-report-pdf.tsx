import React from "react";
import {
  Document as PdfDocument,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0E0D0C",
    color: "#F4EFE6",
    fontFamily: "Helvetica",
    padding: 30,
    fontSize: 10,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFB000",
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFB000",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#8C8782",
    marginTop: 4,
  },
  statGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#171513",
    borderWidth: 1,
    borderColor: "#2F2A25",
    padding: 10,
    borderRadius: 2,
  },
  statLabel: {
    fontSize: 8,
    color: "#8C8782",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F4EFE6",
    marginTop: 4,
  },
  table: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#2F2A25",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#211E1B",
    borderBottomWidth: 1,
    borderBottomColor: "#2F2A25",
    padding: 6,
    fontWeight: "bold",
    color: "#FFB000",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#171513",
    padding: 6,
    fontSize: 8,
  },
  colCategory: { flex: 3 },
  colAllocated: { flex: 2, textAlign: "right" },
  colSpent: { flex: 2, textAlign: "right" },
  colRemaining: { flex: 2, textAlign: "right" },
  colRate: { flex: 1.5, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#2F2A25",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#8C8782",
  },
});

export function FinancialReportPdf({ summary, project }: { summary: any; project: any }) {
  return (
    <PdfDocument>
      <PdfPage size="A4" style={styles.page}>
        <PdfView style={styles.header}>
          <PdfView>
            <PdfText style={styles.title}>BUILDTRACK</PdfText>
            <PdfText style={styles.subtitle}>PROJECT FINANCIAL & EARNED VALUE AUDIT REPORT</PdfText>
          </PdfView>
          <PdfView style={{ alignItems: "flex-end" }}>
            <PdfText style={{ fontSize: 9, color: "#C9C3BB" }}>{project.name}</PdfText>
            <PdfText style={{ fontSize: 8, color: "#8C8782", marginTop: 2 }}>
              Location: {project.location}
            </PdfText>
          </PdfView>
        </PdfView>

        <PdfView style={styles.statGrid}>
          <PdfView style={styles.statCard}>
            <PdfText style={styles.statLabel}>Total Budget</PdfText>
            <PdfText style={styles.statValue}>${summary.totalBudget.toLocaleString()}</PdfText>
          </PdfView>
          <PdfView style={styles.statCard}>
            <PdfText style={styles.statLabel}>Total Spent</PdfText>
            <PdfText style={[styles.statValue, { color: summary.isOverrun ? "#E03131" : "#FFB000" }]}>
              ${summary.totalSpent.toLocaleString()}
            </PdfText>
          </PdfView>
          <PdfView style={styles.statCard}>
            <PdfText style={styles.statLabel}>Remaining</PdfText>
            <PdfText style={styles.statValue}>${summary.remainingBudget.toLocaleString()}</PdfText>
          </PdfView>
          <PdfView style={styles.statCard}>
            <PdfText style={styles.statLabel}>Utilization</PdfText>
            <PdfText style={styles.statValue}>{summary.utilizationRate}%</PdfText>
          </PdfView>
        </PdfView>

        <PdfText style={{ fontSize: 11, fontWeight: "bold", color: "#F4EFE6", marginTop: 10 }}>
          Category Variance Ledger
        </PdfText>
        <PdfView style={styles.table}>
          <PdfView style={styles.tableHeader}>
            <PdfText style={styles.colCategory}>EXPENSE CATEGORY</PdfText>
            <PdfText style={styles.colAllocated}>ALLOCATED</PdfText>
            <PdfText style={styles.colSpent}>SPENT</PdfText>
            <PdfText style={styles.colRemaining}>REMAINING</PdfText>
            <PdfText style={styles.colRate}>UTIL %</PdfText>
          </PdfView>
          {summary.categories.map((c: any) => (
            <PdfView key={c.categoryId} style={styles.tableRow}>
              <PdfText style={styles.colCategory}>{c.categoryName}</PdfText>
              <PdfText style={styles.colAllocated}>${c.allocated.toLocaleString()}</PdfText>
              <PdfText style={[styles.colSpent, { color: c.isOverrun ? "#E03131" : "#F4EFE6" }]}>
                ${c.spent.toLocaleString()}
              </PdfText>
              <PdfText style={styles.colRemaining}>${c.remaining.toLocaleString()}</PdfText>
              <PdfText style={styles.colRate}>{c.utilizationRate}%</PdfText>
            </PdfView>
          ))}
        </PdfView>

        <PdfView style={styles.footer}>
          <PdfText>Generated by BuildTrack Intelligence Engine • Certified Audit Copy</PdfText>
          <PdfText>Date: {new Date().toLocaleDateString()}</PdfText>
        </PdfView>
      </PdfPage>
    </PdfDocument>
  );
}

