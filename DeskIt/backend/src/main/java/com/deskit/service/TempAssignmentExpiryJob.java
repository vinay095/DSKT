package com.deskit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TempAssignmentExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(TempAssignmentExpiryJob.class);

    private final SeatAssignmentService seatAssignmentService;

    public TempAssignmentExpiryJob(SeatAssignmentService seatAssignmentService) {
        this.seatAssignmentService = seatAssignmentService;
    }

    @Scheduled(cron = "${deskit.harden.temp-assignment-expiry-cron:0 */1 * * * *}")
    public void run() {
        int expired = seatAssignmentService.expireDueTemporaryAssignments();
        if (expired > 0) {
            log.info("Expired {} temporary seat assignment(s)", expired);
        }
    }
}
