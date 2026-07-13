# CourtScope Full Intended System

This document records the canonical intended system approved during canonical initialization.

## Core scope

CourtScope is an AGPL-3.0 open-source civic data platform for examining race-based sentencing disparities in Shelby County, Tennessee. V1 covers Criminal Court felony sentencing and General Sessions Criminal Court misdemeanor sentencing and applicable outcomes.

## Public score

100 means lower measured adjusted disparity; 0 means higher measured adjusted disparity. Public bands are More Fair (80–100), Moderately Fair (60–79), Less than Fair (0–59), or Not Enough Data.

## Key safeguards

- controlled statistical modeling
- group-specific and supported pairwise race comparisons
- no combined minority bucket as the primary analysis
- minimum 50 qualifying cases plus subgroup, missingness, match, uncertainty, coverage, stability, identity, source, and court-separation gates
- no individual-case fairness labels
- no defendant names
- confidence intervals and plain-language uncertainty
- adaptive small-cell suppression, never below 10

## Public system

The site includes the homepage dashboard, judge pages, same-court comparison, case-number search, `/methodology`, `/data`, `/data-sources`, `/corrections`, `/governance`, `/add-cities`, English pages, and machine-translated `/es` pages.

## Data and methodology

Official public data, public-records responses, and verified official uploads may be used. Official evidence is retained indefinitely; temporary scrape files may be removed after successful verification. Public downloads use CSV, JSON, and Parquet with source-specific reuse terms. All past and current methodologies remain downloadable.

## Admin and autonomy

Routine safe operations run automatically. High-risk corrections require owner approval. `/admin` is a secure control room with real allowlisted actions and receipts. GitHub credentials and admin secrets stay server-side.

## Excluded from V1

No customer-facing API, no donations or sponsorships, no second active city, no public roadmap, and no individual-case fairness judgment.

