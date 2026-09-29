package com.deskit.service;

import com.deskit.domain.Floor;
import com.deskit.domain.Office;
import com.deskit.repository.FloorRepository;
import com.deskit.repository.OfficeRepository;
import com.deskit.web.org.dto.WorkspaceResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read-only compatibility layer for frontend code that still thinks in "workspaces".
 * Canonical model remains offices → floors.
 */
@Service
public class WorkspaceCompatService {

    private final FloorRepository floorRepository;
    private final OfficeRepository officeRepository;

    public WorkspaceCompatService(FloorRepository floorRepository, OfficeRepository officeRepository) {
        this.floorRepository = floorRepository;
        this.officeRepository = officeRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> listAll() {
        List<Floor> floors = floorRepository.findByActiveTrueAndDeletedAtIsNullOrderByLabelAsc();
        Map<String, Office> offices = officeRepository.findByActiveTrueAndDeletedAtIsNullOrderByNameAsc()
                .stream()
                .collect(Collectors.toMap(Office::getId, Function.identity()));
        List<WorkspaceResponse> out = new ArrayList<>(floors.size());
        for (Floor floor : floors) {
            Office office = offices.get(floor.getOfficeId());
            if (office != null) {
                out.add(WorkspaceResponse.from(floor, office));
            }
        }
        return out;
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse get(String workspaceId) {
        Floor floor = floorRepository.findByIdAndActiveTrueAndDeletedAtIsNull(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Workspace/floor not found: " + workspaceId
                ));
        Office office = officeRepository.findByIdAndActiveTrueAndDeletedAtIsNull(floor.getOfficeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Office not found for workspace: " + workspaceId
                ));
        return WorkspaceResponse.from(floor, office);
    }
}
