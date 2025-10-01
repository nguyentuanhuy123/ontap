package iuh.fit.se.lab05_04.controllers;

import iuh.fit.se.lab05_04.daos.DienThoaiDAO;
import iuh.fit.se.lab05_04.daos.NhaCungCapDAO;
import iuh.fit.se.lab05_04.daos.impls.DienThoaiDAOImpl;
import iuh.fit.se.lab05_04.daos.impls.NhaCungCapDAOImpl;
import iuh.fit.se.lab05_04.models.DienThoai;
import iuh.fit.se.lab05_04.models.NhaCungCap;
import iuh.fit.se.lab05_04.utils.EntityManagerFactoryUtil;
import jakarta.persistence.EntityManager;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
@WebServlet("/quanly")
public class QuanLyFormServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String kw=req.getParameter("kw");
        String mancc=req.getParameter("maNcc");
        EntityManager entityManager= EntityManagerFactoryUtil.getEntityManager();
        try{
            NhaCungCapDAO nhaCungCapDAO=new NhaCungCapDAOImpl(entityManager);
            DienThoaiDAO dienThoaiDAO=new DienThoaiDAOImpl(entityManager);

            List<NhaCungCap> nccs;
            if(kw!=null&&!kw.trim().isEmpty()){
                nccs=nhaCungCapDAO.search(kw);
            }else {
                nccs=nhaCungCapDAO.findAll();
            }
            List<DienThoai> dts;
            List<String> nccIds;
            if(mancc!=null&&!mancc.trim().isEmpty()){
                nccIds=List.of(mancc);
                nccs=nhaCungCapDAO.search(mancc);
            }else {
                nccIds=nccs.stream().map(NhaCungCap::getMaNcc).toList();
            }
            if(nccIds.isEmpty()){
                dts=List.of();
            }else{
                dts=dienThoaiDAO.getByNcc(nccIds);
            }
            List<NhaCungCap> nccs1=nhaCungCapDAO.findAll();

            req.setAttribute("nccs1",nccs1);
            req.setAttribute("nccs",nccs);
            req.setAttribute("dts",dts);

            req.getRequestDispatcher("/views/QuanLyForm.jsp").forward(req,resp);
        }finally {
            if(entityManager.isOpen()){
                entityManager.close();
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String id=req.getParameter("maDt");
        EntityManager entityManager= EntityManagerFactoryUtil.getEntityManager();
        try{
            NhaCungCapDAO nhaCungCapDAO=new NhaCungCapDAOImpl(entityManager);
            DienThoaiDAO dienThoaiDAO=new DienThoaiDAOImpl(entityManager);

            if(id!=null&&!id.trim().isEmpty()){
                dienThoaiDAO.delete(id);
            }

            resp.sendRedirect(req.getContextPath()+"/quanly");
        }finally {
            if(entityManager.isOpen()){
                entityManager.close();
            }
        }
    }
}
