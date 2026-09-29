package com.deskit.repository;

import com.deskit.domain.ElementType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ElementTypeRepository extends JpaRepository<ElementType, Long> {

    boolean existsByElementId(String elementId);

    @Query("select e from ElementType e left join fetch e.predefined order by e.category, e.elementName")
    List<ElementType> findAllWithPredefined();
}
