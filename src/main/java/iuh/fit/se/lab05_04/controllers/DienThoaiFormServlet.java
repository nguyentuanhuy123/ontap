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
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@WebServlet("/dt-form")
@MultipartConfig
public class DienThoaiFormServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        EntityManager entityManager= EntityManagerFactoryUtil.getEntityManager();
        try{
            NhaCungCapDAO nhaCungCapDAO=new NhaCungCapDAOImpl(entityManager);
            List<NhaCungCap> nccs=nhaCungCapDAO.findAll();

            req.setAttribute("nccs",nccs);

            req.getRequestDispatcher("/views/DienThoaiForm.jsp").forward(req,resp);
        }finally {
            if(entityManager.isOpen()){
                entityManager.close();
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        EntityManager entityManager=EntityManagerFactoryUtil.getEntityManager();
        try{

            req.setCharacterEncoding("UTF-8");
            String maDt=req.getParameter("maDt");
            String tenDt=req.getParameter("tenDt");
            String namSanXuat=req.getParameter("namSanXuat");
            String cauHinh=req.getParameter("cauHinh");
            String maNcc=req.getParameter("maNcc");
            Part hinhAnh=req.getPart("hinhAnh");

            DienThoai dienThoai=new DienThoai(maDt,tenDt,namSanXuat,cauHinh,entityManager.find(NhaCungCap.class,maNcc),hinhAnh.getSubmittedFileName());
            if(hinhAnh!=null&&hinhAnh.getSize()>0){
                String contentType=hinhAnh.getContentType();
                String submitted= Paths.get(hinhAnh.getSubmittedFileName()).getFileName().toString();
                String iPaths=getServletContext().getRealPath("/images");
                Path iDir=Paths.get(iPaths);
                if(!Files.exists(iDir)){
                    Files.createDirectories(iDir);
                }
                Path target=iDir.resolve(submitted);
                try(InputStream is=hinhAnh.getInputStream()){
                    Files.copy(is,target, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }


            DienThoaiDAO dienThoaiDAO=new DienThoaiDAOImpl(entityManager);
            try{
                dienThoaiDAO.add(dienThoai);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            resp.sendRedirect(req.getContextPath()+"/danhsach");

        }finally {
            if(entityManager.isOpen()){
                entityManager.close();
            }
        }
    }
}
