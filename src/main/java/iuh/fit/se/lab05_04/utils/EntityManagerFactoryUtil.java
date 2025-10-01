package iuh.fit.se.lab05_04.utils;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class EntityManagerFactoryUtil {
    private static final EntityManagerFactory entityManagerFactory;
    static {
        try{
            entityManagerFactory= Persistence.createEntityManagerFactory("phones");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    public static EntityManager getEntityManager(){
        return entityManagerFactory.createEntityManager();
    }
    public static void close(){
        if(entityManagerFactory.isOpen()){
            entityManagerFactory.close();
        }
    }
}
