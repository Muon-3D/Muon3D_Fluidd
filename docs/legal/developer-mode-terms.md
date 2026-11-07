# Developer Mode terms

> **DRAFT for legal review. Not legal advice, and not yet in force.**
> Written by the Muon3D team on 16 October 2026 so that the printer, the
> app and the website can all show the same words. A lawyer will review it
> before launch.

Version: dev-mode-terms-v1-draft
Date: 16 October 2026

<!-- terms:start -->
**Version 1 (draft), 16 October 2026**

These terms apply when you turn on Developer Mode on a Muon3D M1. Please
read them before you accept. You are accepting this version, and the printer
notes which version you accepted.

## 1. What Developer Mode is

Normally your M1 runs the configuration Muon3D made for it: the settings and
macros that control its heaters, motors and movement, and the limits that keep
them safe.

Developer Mode gives you your own copy of that configuration to change. While
it is on, the printer runs your copy instead of ours. You can change things we
normally protect, including:

- heater temperature limits and the checks that turn a heater off when
  something goes wrong
- how far, how fast and how hard each axis can move
- the macros the printer runs at the start and end of a print, and when it
  homes or probes the bed

## 2. Turning it on

- Turning it on takes two steps: accepting these terms, then pressing the knob
  on the printer itself. A request from a phone or browser alone can't turn it
  on.
- If the printer is linked to a Muon3D account, only the owner of that account
  can ask to turn it on.
- Turning it on is recorded. See section 6.

## 3. Your warranty and your legal rights

**Turning on Developer Mode does not, on its own, end your warranty or affect
your legal rights.**

- **Not covered:** faults, damage or wear caused by changes made in Developer
  Mode, or by running the printer outside the limits Muon3D set. That includes
  changes made by you or by anyone you let use the printer. We won't repair or
  replace these free of charge under the Muon3D warranty.
- **Still covered:** faults that have nothing to do with those changes, for
  example a part that fails in the normal way or was faulty when it arrived.
  These are handled exactly as if Developer Mode had never been on.
- **Working out the cause:** if you report a fault, we may ask you to turn
  Developer Mode off, or start again from the Muon3D configuration, so we can
  see whether the fault is still there. We may also look at the record of when
  Developer Mode was on.
- **Your legal rights:** if you are a consumer, you have legal rights that
  these terms do not take away, for example under the Consumer Rights Act 2015.
  Nothing in these terms limits our responsibility for death or personal
  injury caused by our negligence, for fraud, or for anything else the law does
  not allow us to limit.

## 4. Safety

Changing these settings can make the printer unsafe. With the wrong values a
heater can overheat or keep heating after a fault, which can start a fire, and
the toolhead can drive into the frame or the bed and damage the printer.

While Developer Mode is on:

- you are responsible for the changes you make and for what the printer does
  because of them
- stay with the printer while it runs changes you haven't tested, and be ready
  to stop it
- keep it away from anything that could catch fire, and keep a working smoke
  alarm nearby
- don't use Developer Mode to work around a fault. Contact Muon3D support
  instead

## 5. Updates and support

- Software updates still work while Developer Mode is on.
- Updates change the Muon3D configuration, not your copy. While Developer Mode
  is on, your printer won't pick up configuration fixes from an update. To get
  them, turn Developer Mode off or start again from the Muon3D configuration.
- We'll still help with questions about your printer. We can't support
  configurations you have changed, and we may ask you to go back to ours first.

## 6. What is recorded

- **On the printer:** each time Developer Mode is turned on, the printer notes
  the time, the version of these terms, and whether it was turned on at the
  printer or over the network.
- **With Muon3D:** the first time Developer Mode is turned on, the printer
  tells Muon3D when it happened and which version of these terms was accepted,
  once it is online. It does not send your name. Muon3D keeps this record.
- **In the hardware:** on printers where it is switched on, a one-time fuse in
  the printer's electronics is set the first time Developer Mode is turned on.
  No update, reset or repair of the software can clear it. The Developer Mode
  page in Settings says whether your printer has this.

These records stay after you turn Developer Mode off. They exist so that you
and we can tell, later, whether the printer has ever run a changed
configuration.

## 7. Turning it off

- You can turn Developer Mode off at any time from Settings. You may be asked
  to confirm at the printer.
- The printer goes back to the Muon3D configuration straight away.
- Your copy stays on the printer. If you turn Developer Mode on again, your
  copy is moved into the backups folder and you start from a fresh copy of
  the current Muon3D configuration. The printer keeps your most recent backups
  and deletes older ones.
- Turning it off does not remove the records in section 6.

## 8. Changes to these terms

If we change these terms we'll give the new version a new number. You'll be
asked to read and accept it the next time you turn Developer Mode on. A change
doesn't affect what applied while you used an earlier version.

## 9. Who we are

These terms are offered by [Muon3D legal entity name], a company registered
in England and Wales, company number [number], registered office [address].
Contact: [support email address].
<!-- terms:end -->

## Notes for the reviewer

Not part of the terms. Questions the Muon3D team would like answered:

1. **Guarantee versus statutory rights.** Section 3 treats the Muon3D warranty
   as a consumer guarantee (CRA 2015 s.30) that excludes damage caused by
   modification, while leaving statutory rights (ss.9-11, remedies, s.31) and
   product liability (Consumer Protection Act 1987) alone. Is that the right
   framing, and is the s.30 plain-language requirement met?
2. **Burden of proof.** Within six months of delivery a fault is presumed to
   have been there at delivery (CRA s.19(14)-(15)). Does a Developer Mode
   record change who has to show what, and should section 3 say anything
   about it?
3. **Safety wording.** Is section 4 enough, given the configuration can remove
   thermal-runaway protection? Should we require anything more before
   enabling (for example a second confirmation for heater limits)?
4. **Recording and data.** Section 6 describes personal data processing (the
   printer log and the report to Muon3D). Does it need to point to a privacy
   notice, and what is the lawful basis?
5. **Business buyers.** These terms are written for consumers. Do business
   customers need different wording (UCTA 1977)?
6. **The internal event name.** The report the printer sends Muon3D is named
   `com.muon3d.warranty-voided` in code. It should probably be renamed to
   match section 3, since turning Developer Mode on does not void the warranty.
7. **Owner rule.** Section 2's "only the owner of a linked account" describes
   the intended behaviour (MuonOS PR 378), which may not be on every printer
   yet.
