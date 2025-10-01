package iuh.fit.se.lab05_04.daos;

import iuh.fit.se.lab05_04.models.NhaCungCap;

import java.util.List;

public interface NhaCungCapDAO {
    public List<NhaCungCap> findAll();
    public List<NhaCungCap> search(String kw);
}
