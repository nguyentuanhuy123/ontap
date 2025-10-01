package iuh.fit.se.lab05_04.daos;

import iuh.fit.se.lab05_04.models.DienThoai;

import java.util.List;

public interface DienThoaiDAO {
    public List<DienThoai> getByNcc(List<String> ids);
    public boolean add(DienThoai dienThoai);
    public boolean delete(String id);
}
