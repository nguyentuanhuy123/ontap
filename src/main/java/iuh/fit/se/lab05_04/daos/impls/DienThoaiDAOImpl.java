package iuh.fit.se.lab05_04.daos.impls;

import iuh.fit.se.lab05_04.daos.DienThoaiDAO;
import iuh.fit.se.lab05_04.models.DienThoai;
import iuh.fit.se.lab05_04.models.NhaCungCap;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;

import java.util.List;

public class DienThoaiDAOImpl implements DienThoaiDAO {
    private EntityManager entityManager;
    public DienThoaiDAOImpl(EntityManager entityManager){
        this.entityManager=entityManager;
    }

    @Override
    public List<DienThoai> getByNcc(List<String> ids) {
        return entityManager.createQuery("select dt from DienThoai  dt where dt.ncc.maNcc in :ids", DienThoai.class)
                .setParameter("ids",ids)
                .getResultList();
    }

    @Override
    public boolean add(DienThoai dienThoai) {
        EntityTransaction transaction= entityManager.getTransaction();
        try{
            transaction.begin();
            entityManager.persist(dienThoai);
            transaction.commit();
            return true;
        } catch (Exception e) {
            if(transaction.isActive()){
                transaction.rollback();
            }
            return false;
        }
    }

    @Override
    public boolean delete(String id) {
        EntityTransaction transaction= entityManager.getTransaction();
        try{
            transaction.begin();
            DienThoai dienThoai=entityManager.find(DienThoai.class,id);
            if(dienThoai==null){
                return false;
            }
            entityManager.remove(dienThoai);
            transaction.commit();
            return true;
        } catch (Exception e) {
            if(transaction.isActive()){
                transaction.rollback();
            }
            return false;
        }
    }
}
