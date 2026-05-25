# Volt N' Vent — Wellness Check SMS Drip (GHL Outbound)

**Offer:** HVAC Wellness Check — **$29.95** (paid to technician on-site)  
**Audience:** Las Vegas homeowners (~6,000)  
**Timing:** Late May — pre-summer heat push  
**Send pace:** 1 new contact every **5 minutes**  
**Replies:** Handled by **Alex** (SMS bot) — no GHL auto-reply needed

---

## Before you launch in GHL

1. **Conversation AI → SMS auto-reply:** OFF  
2. **Tag every contact in this campaign:** `wellness-drip-2025` (optional but helps your team filter)  
3. **Pipeline:** Marketing Pipeline — Alex moves stages + notes when they reply  
4. **Compliance:** Every outbound includes opt-out language (included below)  
5. **Do NOT** enable a GHL "Customer Replied → webhook" bot workflow — Alex poller handles replies

---

## MESSAGE 1 — Initial send (copy/paste)

**Send:** Day 0 · to each new contact (one every 5 min)

```
Hi {{contact.first_name}}, this is Volt N' Vent — local HVAC here in Las Vegas.

Vegas heat is about to hit hard. We're offering a $29.95 HVAC Wellness Check before summer so you know your system is ready — not guessing when it's 110°.

We check your system's static pressure first (like blood pressure for your AC). If something's off, we catch it early — way cheaper than a breakdown in July.

$29.95 paid to the tech on-site. Interested? Reply YES and we'll get you scheduled.

Reply STOP to opt out.
```

**Alt shorter (1 SMS segment — use if you want lower cost):**

```
Hi {{contact.first_name}}, Volt N' Vent here in Vegas. Before summer hits we're doing $29.95 HVAC Wellness Checks — catch small issues now, not during a 110° breakdown. Reply YES to schedule or STOP to opt out.
```

---

## MESSAGE 2 — No reply follow-up

**Send:** 3 days after Message 1 · only if **no reply**

```
Hey {{contact.first_name}}, quick follow-up from Volt N' Vent.

Most Vegas breakdowns hit the first brutal heat wave — when every AC company is slammed. A $29.95 wellness check now takes about an hour and tells you if you're good to go.

Reply YES to grab a spot or STOP to opt out.
```

---

## MESSAGE 3 — Final nudge

**Send:** 7 days after Message 1 · only if **still no reply**

```
Last note from Volt N' Vent, {{contact.first_name}}.

Our $29.95 pre-summer wellness check wraps up soon. One visit, full system look-over, peace of mind before it gets stupid hot.

Reply YES if you want in — or STOP and we won't text again.
```

---

## Why this works (talking points for your team / Alex context)

| Hook | Why it lands in Vegas |
|------|------------------------|
| **Timing** | Late May = last calm window before peak AC season |
| **$29.95** | Low risk, clear price, paid on-site only |
| **Static pressure** | Most telling reading on the system — not a sales gimmick |
| **Breakdown in July** | Real fear, but framed as *avoidable* not scare tactics |
| **Local** | Volt N' Vent, Las Vegas — not a national call center |

---

## When they reply — what Alex does

| They say | Alex should |
|----------|-------------|
| YES / interested / book | Offer Mon–Fri window (8–12 or 12–4), one question at a time |
| What is it / what do you check | Static pressure + preventative visit — 1–2 sentences, not a lecture |
| Why $29.95 | Covers getting a tech out + real inspection, no surprises |
| Not interested / STOP | Polite close, no re-pitch — pipeline → Not interested / DND |
| AC broken now | Switch to service mode — **not** wellness pitch |

Alex already has this in Supabase. Replies show in GHL with notes + pipeline updates.

---

## GHL automation skeleton

```
TRIGGER: Tag added "wellness-drip-2025" OR manual bulk action
  │
  ├─ Wait 5 minutes (between each contact entering workflow — use re-entry / batch settings)
  │
  ├─ Send SMS → Message 1
  │
  ├─ Wait 3 days
  ├─ IF no reply → Send SMS → Message 2
  │
  ├─ Wait 4 more days (7 total from Message 1)
  └─ IF no reply → Send SMS → Message 3
```

**Rate limit tip:** If GHL sends faster than 1/5min, add a **Wait** step at the start of the workflow or use a single-contact queue tag so only one enrollment fires every 5 minutes.

---

## Optional: merge fields

| Field | GHL picker |
|-------|------------|
| First name | `{{contact.first_name}}` |
| Fallback if blank | Use "there" in copy: "Hi there," |

---

## Do NOT say in outbound (keep Alex compliant)

- Repair/replacement/install prices  
- "Your AC will definitely fail"  
- Discounts beyond the $29.95 offer  
- Maintenance plan pitch (that's in-home with the tech)

---

**Volt N' Vent · JNB Services LLC · 702-808-8861 · Reply STOP to opt out**
