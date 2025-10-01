package iuh.fit.se.lab05_04.daos.impls;

import iuh.fit.se.lab05_04.daos.NhaCungCapDAO;
import iuh.fit.se.lab05_04.models.NhaCungCap;
import jakarta.persistence.EntityManager;

import java.util.List;

public class NhaCungCapDAOImpl implements NhaCungCapDAO {
    private EntityManager entityManager;
    public NhaCungCapDAOImpl(EntityManager entityManager){
        this.entityManager=entityManager;
    }

    @Override
    public List<NhaCungCap> findAll() {
        return entityManager.createQuery("select ncc from NhaCungCap  ncc", NhaCungCap.class)
                .getResultList();
    }

    @Override
    public List<NhaCungCap> search(String kw) {
        return entityManager.createQuery("select ncc from NhaCungCap  ncc where ncc.maNcc like :kw" +
                        " or ncc.tenNhaCc like :kw " +
                        "or ncc.diaChi like :kw " +
                        "or ncc.soDienThoai like :kw", NhaCungCap.class)
                .setParameter("kw",kw)
                .getResultList();
    }
}
